import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Heading,
  IconButton,
} from "@chakra-ui/react";
import { useAuth } from "@/lib/AuthContext";
import { useConversation } from "@/lib/useConversation";
import { useUsers } from "@/lib/useUsers";

export default function Conversation() {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();
  const [messageInput, setMessageInput] = useState("");
  const [conversationId, setConversationId] = useState("test-conversation-123");
  const [currentConversationId, setCurrentConversationId] = useState(
    "test-conversation-123"
  );
  const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(
    new Set()
  );
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getUsername } = useUsers();

  const { messages, sendMessage, sendTyping, sendStopTyping } = useConversation(
    currentConversationId,
    user?.userId,
    token
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing indicators
  useEffect(() => {
    // Process typing messages
    const typingMessages = messages.filter(
      (message) =>
        "system" in message &&
        (message.type === "start_typing" || message.type === "stop_typing")
    );

    setTypingUsers((prev) => {
      const newTypingUsers = new Set(prev);

      typingMessages.forEach((message) => {
        if (message.type === "start_typing") {
          newTypingUsers.add(message.userId);
        } else if (message.type === "stop_typing") {
          newTypingUsers.delete(message.userId);
        }
      });

      return newTypingUsers;
    });
  }, [messages]);

  // Cleanup typing timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth");
    }
  }, [user, isLoading, router]);

  const handleJoinConversation = () => {
    if (conversationId.trim()) {
      setCurrentConversationId(conversationId.trim());
      setDismissedMessages(new Set()); // Reset dismissed messages when joining new conversation
      setTypingUsers(new Set()); // Reset typing indicators when joining new conversation

      // Stop current typing indicators
      stopTyping();
    }
  };

  const handleDismissMessage = (messageId: string) => {
    setDismissedMessages((prev) => new Set([...prev, messageId]));
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    sendMessage({
      content: messageInput,
      conversationId: currentConversationId,
    });
    setMessageInput("");

    // Stop typing indicators when message is sent
    stopTyping();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTyping();

      // Set up interval to send typing indicator every 3 seconds
      typingIntervalRef.current = setInterval(() => {
        sendTyping();
      }, 3000);
    }

    // Reset the 5-second timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 5000);
  };

  const stopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      sendStopTyping();

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  if (isLoading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text>Loading...</Text>
      </Container>
    );
  }

  if (!user) {
    return null; // Will redirect to auth page
  }

  return (
    <Container maxW="container.lg" py={4}>
      <VStack gap={4} h="95vh">
        {/* Header */}
        <HStack w="full" p={4} bg="gray.50" borderRadius="lg">
          <Heading size="md">Conversation</Heading>
          <Box flex={1} />
          <HStack gap={3}>
            <Text fontSize="sm" color="gray.600">
              Welcome, {user.username}!
            </Text>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </HStack>
        </HStack>

        {/* Conversation ID Input */}
        <VStack w="full" gap={2} align="stretch">
          <Text fontSize="sm" fontWeight="medium">
            Conversation ID
          </Text>
          <HStack gap={2}>
            <Input
              placeholder="Enter conversation ID..."
              value={conversationId}
              onChange={(e) => setConversationId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleJoinConversation();
                }
              }}
            />
            <Button
              colorScheme="blue"
              onClick={handleJoinConversation}
              disabled={!conversationId.trim()}
            >
              Join
            </Button>
          </HStack>
        </VStack>

        {/* Current Conversation Info */}
        <Box w="full" p={3} bg="blue.50" borderRadius="lg">
          <Text fontSize="sm" color="blue.700">
            Currently in: <strong>{currentConversationId}</strong>
          </Text>
        </Box>

        {/* Messages */}
        <Box
          w="full"
          bg="gray.50"
          borderRadius="lg"
          p={4}
          overflowY="auto"
          maxH="60vh"
        >
          <VStack gap={3} align="stretch">
            {messages
              .filter((message) => !dismissedMessages.has(message.id))
              .filter(
                (message) =>
                  !(
                    "system" in message &&
                    (message.type === "start_typing" ||
                      message.type === "stop_typing")
                  )
              )
              .map((message) => {
                if ("system" in message) {
                  // System message - display as dismissible notification
                  return (
                    <Box
                      key={message.id}
                      w="full"
                      p={3}
                      bg="yellow.50"
                      border="1px solid"
                      borderColor="yellow.200"
                      borderRadius="md"
                      position="relative"
                    >
                      <HStack justify="space-between" align="flex-start">
                        <HStack gap={2} align="center" flex={1}>
                          <Text
                            fontSize="sm"
                            color="yellow.800"
                            fontStyle="italic"
                          >
                            👁️{" "}
                            {message.type === "welcome"
                              ? `Welcome ${user.username} to the conversation!`
                              : message.type === "user_joined"
                              ? `👋 ${getUsername(
                                  message.userId
                                )} joined the conversation!`
                              : `👋 ${getUsername(
                                  message.userId
                                )} left the conversation!`}
                          </Text>
                        </HStack>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          aria-label="Dismiss message"
                          onClick={() => handleDismissMessage(message.id)}
                          color="yellow.600"
                          _hover={{ bg: "yellow.100" }}
                        >
                          ✕
                        </IconButton>
                      </HStack>
                    </Box>
                  );
                }

                // Regular user message
                return (
                  <Box
                    key={message.id}
                    alignSelf={
                      message.userId === user.userId.toString()
                        ? "flex-end"
                        : "flex-start"
                    }
                    maxW="70%"
                  >
                    <HStack gap={2} align="flex-start">
                      <Box
                        bg={
                          message.userId === user.userId.toString()
                            ? "blue.500"
                            : "white"
                        }
                        color={
                          message.userId === user.userId.toString()
                            ? "white"
                            : "black"
                        }
                        p={3}
                        borderRadius="lg"
                        boxShadow="sm"
                      >
                        <Text fontSize="xs" opacity={0.7} mb={1}>
                          {getUsername(message.userId)}
                        </Text>
                        <Text fontSize="sm">{message.content}</Text>
                        <Text fontSize="xs" opacity={0.7} mt={1}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                );
              })}
            <div ref={messagesEndRef} />
          </VStack>
        </Box>

        {/* Typing Indicators */}
        {typingUsers.size > 0 && (
          <Box w="full" p={3} bg="gray.100" borderRadius="lg">
            <Text fontSize="sm" color="gray.600" fontStyle="italic">
              {Array.from(typingUsers)
                .map((userId) => getUsername(userId))
                .join(", ")}{" "}
              {typingUsers.size === 1 ? "is" : "are"} typing...
            </Text>
          </Box>
        )}

        {/* Message Input */}
        <HStack w="full" gap={3}>
          <Input
            placeholder="Type your message..."
            value={messageInput}
            onChange={(e) => {
              const newValue = e.target.value;
              setMessageInput(newValue);

              if (newValue.trim() === "") {
                // Stop typing if textbox is cleared
                stopTyping();
              } else {
                // Continue typing if there's content
                handleTyping();
              }
            }}
            onKeyDown={handleKeyPress}
            size="lg"
          />
          <Button
            colorScheme="blue"
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            size="lg"
          >
            Send
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
}

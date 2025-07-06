import { useState } from "react";
import { useRouter } from "next/router";
import { Box, Container, VStack, Text, Heading, Tabs } from "@chakra-ui/react";
import { useAuth } from "@/lib/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function Auth() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = router.query.tab;
    return tab === "register" ? "1" : "0";
  });

  // Redirect if already authenticated
  if (!isLoading && user) {
    router.push("/conversation");
    return null;
  }

  const handleAuthSuccess = () => {
    router.push("/conversation");
  };

  if (isLoading) {
    return (
      <Container maxW="container.sm" py={8}>
        <Text>Loading...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.sm" py={8}>
      <VStack gap={8}>
        {/* Header */}
        <VStack gap={2}>
          <Heading size="lg">Welcome to Conversations</Heading>
          <Text color="gray.600" textAlign="center">
            Sign in to your account or create a new one to start chatting
          </Text>
        </VStack>

        {/* Auth Forms */}
        <Box w="full" bg="white" p={6} borderRadius="lg" boxShadow="md">
          <Tabs.Root
            value={activeTab}
            onValueChange={({ value }) => setActiveTab(value)}
            alignItems="left"
          >
            <Tabs.Content value="0">
              <LoginForm
                onSuccess={handleAuthSuccess}
                onSwitch={() => setActiveTab("1")}
              />
            </Tabs.Content>
            <Tabs.Content value="1">
              <RegisterForm
                onSuccess={handleAuthSuccess}
                onSwitch={() => setActiveTab("0")}
              />
            </Tabs.Content>
          </Tabs.Root>
        </Box>
      </VStack>
    </Container>
  );
}

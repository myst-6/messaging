import { useEffect, useRef, useState } from "react";
import {
  Message,
  WebsocketMessage,
} from "../../../conversations-backend/src/objects/conversation";
import { client } from "./client";
import { MessageDraft } from "../../../conversations-backend/src/routes/conversation";

export function useConversation(conversationId: string, userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const url = new URL(client.conversation.join.$url());
    url.searchParams.set("conversationId", conversationId);
    url.searchParams.set("userId", userId);
    wsRef.current = new WebSocket(url.toString());

    wsRef.current.onopen = () => {
      console.log("Connected to websocket");
    };

    wsRef.current.onmessage = (event) => {
      console.log("Received message", event.data);
      const message = JSON.parse(event.data) as WebsocketMessage;
      switch (message.type) {
        case "history":
          setMessages((prev) => [...prev, ...message.data]);
          break;
        case "message":
          setMessages((prev) => [...prev, message.data]);
          break;
        case "user_joined":
          setMessages((prev) => [
            ...prev,
            {
              content: `[${message.data.userId}] joined the conversation`,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              userId: "system",
            },
          ]);
          break;
        case "user_left":
          setMessages((prev) => [
            ...prev,
            {
              content: `[${message.data.userId}] left the conversation`,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              userId: "system",
            },
          ]);
          break;
      }
    };

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [conversationId, userId]);

  function sendMessage(message: MessageDraft) {
    client.conversation.messages.$post({
      json: {
        content: message.content,
        userId: userId,
        conversationId: conversationId,
      } as unknown as MessageDraft,
    });
  }

  return { messages, sendMessage } as const;
}

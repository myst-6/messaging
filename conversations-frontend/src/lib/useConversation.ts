import { useEffect, useRef, useState } from "react";
import {
  Message,
  WebsocketMessage,
} from "../../../conversations-backend/src/objects/conversation";
import { client } from "./client";
import { MessageDraft } from "../../../conversations-backend/src/routes/conversation";

export type SystemMessage = {
  id: string;
  system: true;
} & (
  | {
      type: "welcome";
    }
  | {
      type: "user_joined";
      userId: string;
    }
  | {
      type: "user_left";
      userId: string;
    }
);

export function useConversation(
  conversationId: string,
  userId: number | undefined,
  token: string | null
) {
  const [messages, setMessages] = useState<(Message | SystemMessage)[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setMessages([]);
    console.log({ token, userId, conversationId });
    if (!token || !userId || !conversationId) return;

    const url = new URL(client.conversation.join.$url());
    url.searchParams.set("conversationId", conversationId);
    url.searchParams.set("userId", userId.toString());
    url.searchParams.set("token", token);
    wsRef.current = new WebSocket(url.toString());

    wsRef.current.onmessage = (event) => {
      console.log("websocket message", event.data);
      try {
        const message = JSON.parse(event.data) as WebsocketMessage;
        switch (message.type) {
          case "ping":
            wsRef.current?.send(JSON.stringify({ type: "pong" }));
            return;
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
                id: crypto.randomUUID(),
                system: true,
                type: "user_joined",
                userId: message.data.userId,
              },
            ]);
            break;
          case "user_left":
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                system: true,
                type: "user_left",
                userId: message.data.userId,
              },
            ]);
            break;
          case "welcome":
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), system: true, type: "welcome" },
            ]);
            break;
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [conversationId, token, userId]);

  function sendMessage(message: MessageDraft) {
    if (!token) return;

    client.conversation.messages.$post({
      json: {
        content: message.content,
        token,
        conversationId,
      },
    });
  }

  return { messages, sendMessage } as const;
}

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

type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
} & {};

export function useConversation(conversationId: string, userId: string) {
  const [messages, setMessages] = useState<
    DeepReadonly<(Message | SystemMessage)[]>
  >([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setMessages([]);

    const url = new URL(client.conversation.join.$url());
    url.searchParams.set("conversationId", conversationId);
    url.searchParams.set("userId", userId);
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

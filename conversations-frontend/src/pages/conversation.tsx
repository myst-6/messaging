import { useConversation } from "@/lib/useConversation";

export default function Conversation() {
  const conversationId = "test-conversation-123";
  const userId = "test-user-123";

  const { messages, sendMessage } = useConversation(conversationId, userId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {messages.map((message) => (
        <p>
          {message.userId} said: {message.content} (
          {new Date(message.timestamp).toLocaleString()})
        </p>
      ))}
      <input
        type="text"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMessage({
              content: e.currentTarget.value,
              userId,
            });
            e.currentTarget.value = "";
          }
        }}
      />
    </div>
  );
}

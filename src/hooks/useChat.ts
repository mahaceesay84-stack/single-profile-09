import { useState } from "react";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type WireMessage = Pick<ChatMessage, "role" | "content">;

type StreamChunk = {
  text?: unknown;
};

function isStreamChunk(value: unknown): value is StreamChunk {
  return typeof value === "object" && value !== null && "text" in value;
}

function getErrorMessage(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("message" in value)) {
    return undefined;
  }
  return typeof value.message === "string" ? value.message : undefined;
}

function createId(): string {
  return crypto.randomUUID();
}

export function useChat(apiUrl: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (value: string) => {
    const content = value.trim();
    if (!content || content.length > 500 || isLoading) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content,
    };
    const assistantId = createId();
    const requestMessages: WireMessage[] = [...messages, userMessage]
      .slice(-6)
      .map(({ role, content: messageContent }) => ({
        role,
        content: messageContent,
      }));

    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);
    setError(null);

    const appendText = (text: string) => {
      setMessages((current) => {
        const existing = current.find((message) => message.id === assistantId);
        if (existing) {
          return current.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + text }
              : message,
          );
        }
        return [
          ...current,
          { id: assistantId, role: "assistant", content: text },
        ];
      });
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: requestMessages }),
      });

      if (!response.ok) {
        let responseMessage: string | undefined;
        try {
          responseMessage = getErrorMessage(await response.json());
        } catch {
          responseMessage = undefined;
        }
        throw new Error(
          responseMessage ??
            "The assistant couldn't reply just now. Please try again.",
        );
      }

      if (!response.body) {
        throw new Error(
          "The assistant couldn't start a response. Please try again.",
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedContent = false;

      const readEvent = (line: string) => {
        if (!line.startsWith("data:")) return;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(payload);
        } catch {
          return;
        }
        if (isStreamChunk(parsed) && typeof parsed.text === "string") {
          receivedContent = true;
          appendText(parsed.text);
        }
      };

      while (true) {
        const { done, value: chunk } = await reader.read();
        buffer += decoder.decode(chunk, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.forEach(readEvent);
        if (done) break;
      }
      if (buffer) readEvent(buffer);
      if (!receivedContent) {
        throw new Error(
          "The assistant returned an empty reply. Please try again.",
        );
      }
    } catch (caught) {
      setMessages((current) =>
        current.filter(
          (message) => message.id !== assistantId || message.content !== "",
        ),
      );
      setError(
        caught instanceof TypeError
          ? "The assistant couldn't connect just now. Please try again."
          : caught instanceof Error
            ? caught.message
            : "The assistant couldn't reply just now. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);
  const appendMessage = (role: ChatRole, content: string) => {
    setMessages((current) => [...current, { id: createId(), role, content }]);
  };

  return { messages, isLoading, error, sendMessage, clearError, appendMessage };
}

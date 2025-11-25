

// src/hooks/useChatStream.js

import { useState, useCallback } from "react";

export default function useChatStream() {
  const [isLoading, setIsLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const askAI = useCallback(async ({ repoId, query, onToken }) => {
    try {
      setIsLoading(true);
      setAiMessage("");

      const res = await fetch("/api/chat/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId, query }),
      });

      // Convert response body into a stream reader
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Split SSE messages
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const json = line.replace("data:", "").trim();
          if (!json) continue;

          let parsed = null;
          try {
            parsed = JSON.parse(json);
          } catch {
            continue;
          }

          // Receive streaming tokens
          if (parsed.type === "token" && parsed.data) {
            setAiMessage((prev) => prev + parsed.data);
            if (onToken) onToken(parsed.data);
          }
        }
      }

      setIsLoading(false);
      return { success: true, message: aiMessage };
    } catch (err) {
      console.error("❌ stream error:", err);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  }, [aiMessage]);

  return {
    askAI,
    isLoading,
    aiMessage
  };
}

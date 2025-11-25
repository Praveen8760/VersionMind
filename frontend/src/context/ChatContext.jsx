
// src/context/ChatContext.jsx
import { createContext, useContext, useState, useRef } from "react";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const eventSourceRef = useRef(null);
  const isStreamingRef = useRef(false);

  /* -----------------------------------------
     RESET CHAT WHEN REPO CHANGES
  ----------------------------------------- */
  const resetChat = () => {
    console.log("%c[CHAT] Resetting chat…", "color: orange");

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    isStreamingRef.current = false;
    setMessages([]);
    setLoading(false);
  };

  /* -----------------------------------------
     SAFE CLOSE SSE
  ----------------------------------------- */
  const closeSSE = () => {
    if (eventSourceRef.current) {
      console.log("%c[CHAT] Closing SSE…", "color: red");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    isStreamingRef.current = false;
    setLoading(false);
  };

  /* -----------------------------------------
     SEND QUERY → START SSE
  ----------------------------------------- */
  const sendQuery = ({ repoId, query }) => {
    if (!repoId || !query) return;

    if (isStreamingRef.current) {
      console.warn("[CHAT] Already streaming. Ignoring new request.");
      return;
    }

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: query }]);

    // Prepare AI message slot
    setMessages((prev) => [...prev, { sender: "ai", text: "" }]);

    setLoading(true);
    isStreamingRef.current = true;

    // Create EventSource
    const es = new EventSource(
      `http://localhost:3000/api/chat/ask/stream?repoId=${repoId}&query=${encodeURIComponent(query)}`
    );

    eventSourceRef.current = es;

    /* -----------------------------------------
       LISTEN TO BACKEND "token" EVENTS
    ----------------------------------------- */
    es.addEventListener("token", (event) => {
        const { token } = JSON.parse(event.data);

        setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];

            // Prevent duplicate chunks
            if (last.text.endsWith(token)) return updated;

            last.text += token;
            return updated;
        });
    });


    /* -----------------------------------------
       STREAM DONE
    ----------------------------------------- */
    es.addEventListener("done", () => {
      console.log("%c[CHAT] STREAM DONE", "color: green");
      closeSSE();
    });

    /* -----------------------------------------
       STREAM ERROR
    ----------------------------------------- */
    es.addEventListener("error", (err) => {
      console.error("[CHAT] SSE ERROR:", err);

      closeSSE();

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "[ERROR] Streaming failed." },
      ]);
    });
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        sendQuery,
        resetChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}

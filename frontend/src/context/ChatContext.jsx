
// src/context/ChatContext.jsx

import { createContext, useContext, useState, useRef } from "react";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const eventSourceRef = useRef(null);
  const isStreamingRef = useRef(false);
  const bufferRef = useRef(""); // AI token buffer
  const lastTokenRef = useRef(""); // duplication control

  /* ---------------------------------------------------------
     RESET CHAT WHEN SWITCHING REPO
  --------------------------------------------------------- */
  const resetChat = () => {
    console.log("%c[CHAT] Resetting chat…", "color: orange");

    closeSSE();

    bufferRef.current = "";
    lastTokenRef.current = "";
    isStreamingRef.current = false;

    setMessages([]);
    setLoading(false);
  };

  /* ---------------------------------------------------------
     SAFE CLOSE SSE CONNECTION
  --------------------------------------------------------- */
  const closeSSE = () => {
    if (eventSourceRef.current) {
      console.log("%c[CHAT] Closing SSE…", "color: red");
      eventSourceRef.current.close();
    }
    eventSourceRef.current = null;
    isStreamingRef.current = false;
    setLoading(false);
  };

  /* ---------------------------------------------------------
     CREATE EMPTY AI MESSAGE SLOT
  --------------------------------------------------------- */
  const pushEmptyAIMessage = () => {
    setMessages((prev) => [...prev, { sender: "ai", text: "", file: null, fn: null }]);
  };

  /* ---------------------------------------------------------
     SEND QUERY → OPEN SSE STREAM
  --------------------------------------------------------- */
  const sendQuery = ({ repoId, query }) => {
    if (!repoId || !query) return;

    if (isStreamingRef.current) {
      console.warn("[CHAT] Cannot send. Already streaming.");
      return;
    }

    // Push user message
    setMessages((prev) => [...prev, { sender: "user", text: query }]);

    // Reserve slot for AI response
    pushEmptyAIMessage();

    setLoading(true);
    isStreamingRef.current = true;
    bufferRef.current = "";
    lastTokenRef.current = "";

    const url = `http://localhost:3000/api/chat/ask/stream?repoId=${repoId}&query=${encodeURIComponent(query)}`;
    console.log("%c[CHAT] SSE OPEN:", "color: cyan", url);

    const es = new EventSource(url);
    eventSourceRef.current = es;

    /* ---------------------------------------------------------
       TOKEN STREAM EVENT
    --------------------------------------------------------- */
    es.addEventListener("token", (event) => {
      const { token } = JSON.parse(event.data);
      if (!token || token === lastTokenRef.current) return;

      lastTokenRef.current = token;
      bufferRef.current += token;

      setMessages((prev) => {
        const u = [...prev];
        const last = u[u.length - 1];
        last.text = bufferRef.current;
        return u;
      });
    });

    /* ---------------------------------------------------------
       META EVENT — linked file/function names  
       { file:"src/index.js", fn:"add" }
    --------------------------------------------------------- */
    es.addEventListener("meta", (event) => {
      const meta = JSON.parse(event.data);

      setMessages((prev) => {
        const u = [...prev];
        const last = u[u.length - 1];

        if (meta.file) last.file = meta.file;
        if (meta.fn) last.fn = meta.fn;

        return u;
      });
    });

    /* ---------------------------------------------------------
       STREAM DONE
    --------------------------------------------------------- */
    es.addEventListener("done", () => {
      console.log("%c[CHAT] Stream Finished", "color: green");
      closeSSE();
    });

    /* ---------------------------------------------------------
       STREAM ERROR
    --------------------------------------------------------- */
    es.addEventListener("error", (err) => {
      console.error("%c[CHAT] SSE ERROR:", "color: red", err);

      closeSSE();

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "[ERROR] Stream failed." },
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

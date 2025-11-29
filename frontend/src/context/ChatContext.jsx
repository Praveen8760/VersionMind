
// src/context/ChatContext.jsx

import { createContext, useContext, useState, useRef } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const eventSourceRef = useRef(null);
  const isStreamingRef = useRef(false);

  const bufferRef = useRef("");    
  const lastTokenRef = useRef(""); 

  /* ============================================================
     LOAD HISTORY ONLY (DB saves are handled by backend!)
  ============================================================ */
  const loadHistory = async (repoId) => {
    try {
      console.log("[CHAT] Loading history for repo:", repoId);

      const res = await fetch(
        `http://localhost:3000/api/chat/history/${repoId}`,
        { credentials: "include" }
      );

      const data = await res.json();
      console.log("[CHAT] History Response:", data);

      if (data?.messages) {
        setMessages(
          data.messages.map((m) => ({
            sender: m.sender,
            text: m.message,
            file: null,
            fn: null,
          }))
        );
      }
    } catch (err) {
      console.error("[CHAT] Load history error:", err);
      setMessages([]);
    }
  };

  /* ============================================================
     RESET CHAT (ON REPO SWITCH)
  ============================================================ */
  const resetChat = async (repoId) => {
    console.log("%c[CHAT] RESET triggered", "color: orange");

    closeSSE();

    bufferRef.current = "";
    lastTokenRef.current = "";
    isStreamingRef.current = false;

    setMessages([]);

    if (repoId) {
      console.log("[CHAT] Loading history on reset...");
      await loadHistory(repoId);
    }

    setLoading(false);
  };

  /* ============================================================
     CLOSE SSE CLEANLY
  ============================================================ */
  const closeSSE = () => {
    try {
      eventSourceRef.current?.close();
    } catch (_) {}

    eventSourceRef.current = null;
    isStreamingRef.current = false;
    setLoading(false);
  };

  /* ============================================================
     ADD EMPTY AI MESSAGE SLOT
  ============================================================ */
  const pushEmptyAIMessage = () => {
    setMessages((prev) => [
      ...prev,
      { sender: "ai", text: "", file: null, fn: null },
    ]);
  };

  /* ============================================================
     SEND MESSAGE (NO DB SAVE HERE)
     Backend handles saving automatically.
  ============================================================ */
  const sendQuery = ({ repoId, query }) => {
    if (!repoId || !query.trim()) return;

    if (isStreamingRef.current) {
      console.warn("[CHAT] Already streaming.");
      return;
    }

    console.log("[CHAT] Sending query:", query);

    // Add user message to UI only
    setMessages((prev) => [...prev, { sender: "user", text: query }]);

    // Create empty AI slot
    pushEmptyAIMessage();

    bufferRef.current = "";
    lastTokenRef.current = "";
    isStreamingRef.current = true;
    setLoading(true);

    const url = `http://localhost:3000/api/chat/ask/stream?repoId=${repoId}&query=${encodeURIComponent(
      query
    )}`;

    console.log("[CHAT] SSE opening:", url);

    const es = new EventSourcePolyfill(url, { withCredentials: true });
    eventSourceRef.current = es;

    /* ================= TOKEN EVENT ================= */
    es.addEventListener("token", (event) => {
      const { token } = JSON.parse(event.data);

      if (!token || token === lastTokenRef.current) return;

      lastTokenRef.current = token;
      bufferRef.current += token;

      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1].text = bufferRef.current;
        return copy;
      });
    });

    /* ================= META EVENT ================= */
    es.addEventListener("meta", (event) => {
      const meta = JSON.parse(event.data);

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];

        if (meta.file) last.file = meta.file;
        if (meta.fn) last.fn = meta.fn;

        return copy;
      });
    });

    /* ================= DONE EVENT ================= */
    es.addEventListener("done", () => {
      console.log("%c[CHAT] Stream finished", "color: green");
      closeSSE();
    });

    /* ================= ERROR EVENT ================= */
    es.addEventListener("error", (err) => {
      console.error("[CHAT] SSE ERROR:", err);

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


// src/components/Chat.jsx

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, UploadCloud, FileCode2, Brackets } from "lucide-react";

import { useChat } from "../context/ChatContext";
import { useRepoImport } from "../context/RepoImportContext";
import RepoImportProgress from "./RepoImportProgress";

/* ------------------------------------------------------
   Markdown / Code formatter (logic untouched)
------------------------------------------------------ */
function renderMessage(text) {
  if (!text) return "";

  text = text.replace(/`([^`]+)`/g, "<code class='inline-code'>$1</code>");

  text = text.replace(/```([\s\S]*?)```/g, (m, code) => {
    return `<pre class="code-block"><code>${code}</code></pre>`;
  });

  return text;
}

export default function Chat({ activeRepo }) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("chat");

  const scrollRef = useRef(null);
  const containerRef = useRef(null);

  const { messages, loading: aiLoading, sendQuery, resetChat } = useChat();
  const { isImporting, progress, startImport } = useRepoImport();

  /* Reset chat on repo switch */
  useEffect(() => {
    resetChat();
  }, [activeRepo]);

  /* Auto scroll */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  /* Send Message */
  const handleSend = () => {
    if (!input.trim()) return;

    if (mode === "chat") {
      if (!activeRepo) return;
      sendQuery({ repoId: activeRepo.id, query: input.trim() });
    } else {
      startImport(input.trim());
    }

    setInput("");
  };

  /* Extract metadata tags */
  const extractLinkedMeta = (msg) => {
    const meta = {};
    if (msg.text.includes("FILE: ")) {
      const match = msg.text.match(/FILE:\s*(.+)/);
      if (match) meta.file = match[1].trim();
    }
    if (msg.text.includes("function ")) {
      const fn = msg.text.match(/function\s+(\w+)/);
      if (fn) meta.fn = fn[1];
    }
    return meta;
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-transparent overflow-hidden">

      {/* ================= CHAT MESSAGES (Scroll Area) ================= */}
      <div
        ref={containerRef}
        className="
          flex-1 overflow-y-auto px-6 pb-40 pt-12
          scrollbar-thin scrollbar-thumb-[#1c1e24] scrollbar-track-transparent
        "
      >
        {/* -------- Empty state when no repo ---------- */}
        {!activeRepo && mode === "chat" && (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center mt-28 text-center"
          >
            {/* Bot icon */}
            <motion.div
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 140, damping: 18 }}
              className="
                w-20 h-20 flex items-center justify-center rounded-3xl 
                bg-[#111318]/80 border border-[#23272e]/80
                shadow-[0_0_35px_-4px_rgba(59,130,246,0.55)]
                backdrop-blur-xl mb-6
              "
            >
              <Bot size={36} className="text-[#3B82F6]" />
            </motion.div>

            <h2 className="text-2xl font-semibold text-gray-200">
              Select a repository to start
            </h2>
            <p className="text-sm text-gray-500 max-w-xs mt-2 leading-relaxed">
              Import a GitHub repository or pick one from the left sidebar.
            </p>
          </motion.div>
        )}

        {/* -------- MESSAGE LIST ---------- */}
        <AnimatePresence>
          {messages.map((msg, index) => {
            const isUser = msg.sender === "user";
            const meta = extractLinkedMeta(msg);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={`flex items-start gap-3 mb-6 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {/* --- Bot Avatar --- */}
                {!isUser && (
                  <div
                    className="
                      w-9 h-9 flex items-center justify-center rounded-xl
                      bg-[#101216] border border-[#202328]
                    "
                  >
                    <Bot size={18} className="text-[#3B82F6]" />
                  </div>
                )}

                {/* --- Message Bubble --- */}
                <div
                  className={`
                    max-w-[75%] px-5 py-3.5 rounded-2xl text-[0.94rem]
                    shadow-[0_8px_20px_-6px_rgba(0,0,0,0.55)] backdrop-blur-lg
                    whitespace-pre-wrap leading-relaxed tracking-wide break-words
                    ${
                      isUser
                        ? "bg-[#3B82F6] text-white rounded-br-none"
                        : "bg-[#16191F]/70 text-gray-200 border border-[#202428] rounded-bl-none"
                    }
                  `}
                >
                  <div
                    className="prose prose-invert text-gray-200"
                    dangerouslySetInnerHTML={{ __html: renderMessage(msg.text) }}
                  />

                  {/* ----- Metadata buttons ----- */}
                  {!isUser && (
                    <div className="flex gap-4 mt-3 text-xs">
                      {meta.file && (
                        <button
                          onClick={() => alert(meta.file)}
                          className="flex items-center gap-1 text-blue-400 hover:underline"
                        >
                          <FileCode2 size={14} /> {meta.file}
                        </button>
                      )}

                      {meta.fn && (
                        <button
                          onClick={() => alert(meta.fn)}
                          className="flex items-center gap-1 text-emerald-400 hover:underline"
                        >
                          <Brackets size={14} /> {meta.fn}()
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* --- User Avatar --- */}
                {isUser && (
                  <div
                    className="
                      w-9 h-9 flex items-center justify-center rounded-xl
                      bg-[#16181d] border border-[#2c2f35]
                    "
                  >
                    <User size={18} className="text-white/80" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={scrollRef} />
      </div>

      {/* Repo Import Progress */}
      {isImporting && <RepoImportProgress progress={progress} />}

      {/* ================= FIXED INPUT BAR (ChatGPT style) ================= */}
      <div
        className="
          absolute bottom-0 left-0 w-full
          px-6 py-6
          backdrop-blur-2xl border-t border-[#16181d]
        "
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-4">

          {/* --- Mode Switch --- */}
          <div
            className="
              relative bg-[#14171C]/70 border border-[#22252b]
              rounded-2xl p-1 flex shadow-lg"
          >
            <motion.div
              layoutId="switch-ui"
              className="absolute top-1 bottom-1 bg-[#3B82F6]/25 rounded-xl shadow-inner"
              animate={{
                left: mode === "chat" ? "4px" : "calc(50% + 4px)",
                width: "calc(50% - 8px)",
              }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            />

            <button
              onClick={() => setMode("chat")}
              className={`relative z-10 w-1/2 py-2 text-sm font-medium ${
                mode === "chat" ? "text-[#3B82F6]" : "text-gray-500"
              }`}
            >
              Chat
            </button>

            <button
              onClick={() => setMode("import")}
              className={`relative z-10 w-1/2 py-2 text-sm font-medium flex items-center justify-center gap-1 ${
                mode === "import" ? "text-[#3B82F6]" : "text-gray-500"
              }`}
            >
              <UploadCloud size={14} /> Import
            </button>
          </div>

          {/* --- Input Field --- */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="
              flex items-center gap-3 h-[58px] px-5
              bg-[#0F1115]/95 border border-[#22252b]
              rounded-2xl shadow-lg backdrop-blur-xl
            "
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={mode === "chat" && !activeRepo}
              placeholder={
                mode === "chat"
                  ? activeRepo
                    ? `Ask about ${activeRepo.name.split("/").pop()}…`
                    : "Select a repository…"
                  : "Enter GitHub repository URL"
              }
              className="flex-1 bg-transparent outline-none text-gray-200 placeholder-gray-500 text-sm"
            />

            <button
              onClick={handleSend}
              disabled={aiLoading || !input.trim()}
              className="
                w-12 h-12 flex items-center justify-center rounded-xl
                bg-[#3B82F6] hover:bg-[#2563eb]
                disabled:bg-[#3B82F6]/30
                transition shadow-md
              "
            >
              <Send size={18} className="text-white" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

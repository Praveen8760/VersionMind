
// src/components/Chat.jsx

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, UploadCloud } from "lucide-react";

import { useChat } from "../context/ChatContext";
import { useRepoImport } from "../context/RepoImportContext";
import RepoImportProgress from "./RepoImportProgress";

export default function Chat({ activeRepo }) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("chat");
  const scrollRef = useRef(null);

  const { messages, loading: aiLoading, sendQuery, resetChat } = useChat();
  const { isImporting, progress, startImport } = useRepoImport();

  /* --------------------------------------------
     RESET CHAT WHEN SWITCHING REPO
  --------------------------------------------- */
  useEffect(() => {
    resetChat();
  }, [activeRepo]);

  /* --------------------------------------------
     AUTOSCROLL TO LAST MESSAGE
  --------------------------------------------- */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  /* --------------------------------------------
     SEND ACTION
  --------------------------------------------- */
  const handleSend = () => {
    if (!input.trim()) return;

    if (mode === "chat") {
      if (!activeRepo) return;
      sendQuery({ repoId: activeRepo.id, query: input.trim() });
      setInput("");
    } else {
      startImport(input.trim());
      setInput("");
    }
  };

  /* --------------------------------------------
     RENDER UI
  --------------------------------------------- */
  return (
    <div className="relative flex flex-col h-full w-full bg-[#0A0B0D]">

      {/* ===================== CHAT THREAD ===================== */}
      <div
        className="
          flex-1 overflow-y-auto px-6 pt-10 pb-36 space-y-7
          scrollbar-thin scrollbar-thumb-[#1c1e24] scrollbar-track-transparent
        "
      >
        {/* ---------- EMPTY STATE (No Active Repo) ---------- */}
        {!activeRepo && mode === "chat" && (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center mt-32 text-center"
          >
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
              Import a GitHub repository or choose one from the left sidebar to begin chatting.
            </p>
          </motion.div>
        )}

        {/* ---------- MESSAGE THREAD ---------- */}
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => {
            const isUser = msg.sender === "user";

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* AI Avatar */}
                {!isUser && (
                  <div
                    className="
                      w-10 h-10 flex items-center justify-center rounded-xl
                      bg-[#101216] border border-[#202328] shadow-md
                    "
                  >
                    <Bot size={20} className="text-[#3B82F6]" />
                  </div>
                )}

                {/* MESSAGE BUBBLE */}
                <div
                  className={`
                    max-w-[75%] px-5 py-3.5 rounded-2xl text-[0.95rem]
                    whitespace-pre-wrap break-words leading-relaxed tracking-wide
                    shadow-[0_8px_25px_-8px_rgba(0,0,0,0.55)] backdrop-blur-lg
                    ${
                      isUser
                        ? "bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-white border border-blue-500/10 rounded-br-none"
                        : "bg-[#16191F]/70 text-gray-200 border border-[#202428] rounded-bl-none"
                    }
                  `}
                >
                  {msg.text}
                </div>

                {/* USER AVATAR */}
                {isUser && (
                  <div
                    className="
                      w-10 h-10 flex items-center justify-center rounded-xl
                      bg-[#16181d] border border-[#2c2f35] shadow-sm
                    "
                  >
                    <User size={20} className="text-white/80" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={scrollRef} />
      </div>

      {/* ============ IMPORT PROGRESS ============ */}
      {isImporting && <RepoImportProgress progress={progress} />}

      {/* ===================== INPUT BAR ===================== */}
      <div
        className="
          sticky bottom-0 w-full px-5 py-6 
          bg-[#0C0D10]/95 backdrop-blur-2xl 
          border-t border-[#16181d]
          shadow-[0_-12px_45px_-22px_rgba(0,0,0,0.75)]
        "
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-4">

          {/* ---------- MODE SWITCH ---------- */}
          <div
            className="
              relative bg-[#14171C]/70 border border-[#22252b]
              rounded-2xl p-1 flex shadow-lg backdrop-blur-xl
            "
          >
            <motion.div
              layoutId="mode-switch"
              className="
                absolute top-1 bottom-1 bg-[#3B82F6]/25 
                rounded-xl shadow-inner
              "
              animate={{
                left: mode === "chat" ? "4px" : "calc(50% + 4px)",
                width: "calc(50% - 8px)",
              }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            />

            {/* Tabs */}
            <button
              onClick={() => setMode("chat")}
              className={`relative z-10 w-1/2 py-2 text-sm font-medium transition-all ${
                mode === "chat" ? "text-[#3B82F6]" : "text-gray-500"
              }`}
            >
              Chat
            </button>

            <button
              onClick={() => setMode("import")}
              className={`relative z-10 w-1/2 py-2 text-sm font-medium flex items-center justify-center gap-1 transition-all ${
                mode === "import" ? "text-[#3B82F6]" : "text-gray-500"
              }`}
            >
              <UploadCloud size={14} />
              Import
            </button>
          </div>

          {/* ---------- INPUT FIELD ---------- */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="
              flex items-center gap-3 h-[58px] px-5
              bg-[#0F1115]/95 border border-[#22252b]
              rounded-2xl backdrop-blur-xl shadow-lg
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
              className="
                flex-1 bg-transparent outline-none text-gray-200 text-sm
                placeholder-gray-500
              "
            />

            <button
              onClick={handleSend}
              disabled={
                aiLoading ||
                (mode === "chat" && !activeRepo) ||
                !input.trim()
              }
              className="
                w-12 h-12 flex items-center justify-center rounded-xl
                bg-[#3B82F6] hover:bg-[#2563eb]
                disabled:bg-[#3B82F6]/30 disabled:cursor-not-allowed
                transition-all shadow-md
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

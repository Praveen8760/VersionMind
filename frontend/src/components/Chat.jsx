

// backend/src/components/Chat.jsx

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, UploadCloud } from "lucide-react";
import { useRepoImport } from "../context/RepoImportContext";




export default function Chat({ activeRepo }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("chat");

  /* ---------------------- IMPORT HOOK ---------------------- */
  const { isImporting, progress, startImport } = useRepoImport();

  /* ---------------------- SEND CHAT ------------------------ */
  const sendMessage = () => {
    if (!activeRepo || !input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setInput("");
  };

  /* ---------------------- SEND IMPORT ---------------------- */
  const importRepo = () => {
    if (!input.trim()) return;

    startImport(input);   // 🚀 SSE-based import starts here
    setInput("");
  };

  return (
    <div className="relative flex flex-col h-full w-full">

      {/* ================ CHAT HISTORY ================ */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">

        {/* Empty UI */}
        {!activeRepo && mode === "chat" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center mt-20 text-center text-gray-400"
          >
            <p className="text-lg font-medium">Select a repository to start chatting.</p>
            <p className="text-sm opacity-70 mt-1">Import a repo or choose one from the left sidebar.</p>
          </motion.div>
        )}

        {/* Chat Messages */}
        {activeRepo &&
          messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 px-2 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* AI Avatar */}
              {msg.sender === "ai" && (
                <div className="w-10 h-10 flex items-center justify-center bg-[#111318] border border-[#22262c] rounded-xl shadow-md">
                  <Bot size={20} className="text-[#3B82F6]" />
                </div>
              )}

              {/* Chat bubble */}
              <div
                className={`
                  max-w-[70%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap break-words
                  ${
                    msg.sender === "user"
                      ? "bg-[#3B82F6] text-white rounded-br-none"
                      : "bg-[#14171C]/70 text-gray-200 border border-[#1f2327] rounded-bl-none backdrop-blur-xl"
                  }
                `}
              >
                {msg.text}
              </div>

              {/* User Avatar */}
              {msg.sender === "user" && (
                <div className="w-10 h-10 flex items-center justify-center bg-[#1d1f23] border border-[#303338] rounded-xl">
                  <User size={20} className="text-white/70" />
                </div>
              )}
            </motion.div>
          ))}
      </div>

      {/* ================ IMPORT PROGRESS UI ================ */}
      {isImporting && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            bg-[#14171C]/80 border border-[#1f2327]
            rounded-xl p-4 mb-3 shadow-xl
            backdrop-blur-xl
          "
        >
          <p className="text-sm text-[#3B82F6] font-medium">
            {progress?.message || "Starting import..."}
          </p>

          <div className="w-full bg-[#0F1115] h-2 rounded-lg mt-3 overflow-hidden">
            <motion.div
              animate={{ width: `${progress?.percent || 0}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-[#3B82F6]"
            />
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {progress?.percent ?? 0}% completed
          </p>
        </motion.div>
      )}

      {/* ================ INPUT BAR ================ */}
      <div className="sticky bottom-0 w-full px-3 pb-3 pt-2 backdrop-blur-xl">
        <div className="w-full max-w-4xl mx-auto">

          {/* -------- SEGMENTED SWITCH -------- */}
          <div className="w-full max-w-xs mx-auto mb-3">
            <div className="relative bg-[#14171C]/80 border border-[#1f2327] rounded-xl p-1 flex shadow-md backdrop-blur-md">

              {/* Sliding highlight */}
              <motion.div
                layoutId="chat-import-highlight"
                className="absolute top-1 bottom-1 bg-[#3B82F6]/25 rounded-lg"
                animate={{
                  left: mode === "chat" ? "4px" : "calc(50% + 4px)",
                  width: "calc(50% - 8px)",
                }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
              />

              {/* Chat tab */}
              <button
                onClick={() => setMode("chat")}
                className={`relative z-10 w-1/2 py-2 text-sm font-medium transition-all ${
                  mode === "chat" ? "text-[#3B82F6]" : "text-gray-400"
                }`}
              >
                Chat
              </button>

              {/* Import tab */}
              <button
                onClick={() => setMode("import")}
                className={`relative z-10 w-1/2 py-2 text-sm font-medium flex items-center justify-center gap-1 transition-all ${
                  mode === "import" ? "text-[#3B82F6]" : "text-gray-400"
                }`}
              >
                <UploadCloud size={14} />
                Import
              </button>
            </div>
          </div>

          {/* -------- INPUT FIELD -------- */}
          <div
            className="
              w-full flex items-center gap-3
              bg-[#0F1115]/80 border border-[#1f2327]
              rounded-2xl px-4 h-[56px]
              shadow-lg
            "
          >
            <input
              type="text"
              placeholder={
                mode === "chat"
                  ? activeRepo
                    ? `Ask something about ${activeRepo}…`
                    : "Select a repo first…"
                  : "Enter GitHub repo URL (ex: user/repo)"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={mode === "chat" && !activeRepo}
              className="flex-1 bg-transparent outline-none text-sm text-gray-200 placeholder-gray-500"
            />

            {/* Send / Import button */}
            <button
              onClick={mode === "chat" ? sendMessage : importRepo}
              disabled={
                (mode === "chat" && !activeRepo) ||
                !input.trim() ||
                isImporting
              }
              className="
                w-10 h-10 flex items-center justify-center
                bg-[#3B82F6] hover:bg-[#2563eb]
                disabled:bg-[#3B82F6]/30
                rounded-xl transition-all
              "
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

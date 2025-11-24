// src/components/Chat.jsx

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, UploadCloud } from "lucide-react";
import { useRepoImport } from "../context/RepoImportContext";
import RepoImportProgress from "./RepoImportProgress";

export default function Chat({ activeRepo }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("chat");

  const { isImporting, progress, startImport } = useRepoImport();

  const sendMessage = () => {
    if (!activeRepo || !input.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setInput("");
  };

  const importRepo = () => {
    if (!input.trim()) return;
    startImport(input);
    setInput("");
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0C0D10]">

      {/* CHAT HISTORY */}
      <div className="flex-1 overflow-y-auto px-4 space-y-7 pt-8 pb-24 
        scrollbar-thin scrollbar-thumb-[#1f2125] scrollbar-track-transparent">

        {/* Empty State */}
        {!activeRepo && mode === "chat" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center mt-32 text-center"
          >
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl 
                bg-[#111317]/70 border border-[#202328] shadow-[0_0_25px_-4px_rgba(59,130,246,0.25)] mb-6 backdrop-blur-xl">
              <Bot size={30} className="text-[#3B82F6]" />
            </div>

            <h2 className="text-xl font-semibold text-gray-200 tracking-tight">
              Select a repository to continue
            </h2>

            <p className="text-sm text-gray-500 max-w-xs mt-2 leading-relaxed">
              Import a GitHub repository or choose one from the sidebar to begin chatting.
            </p>
          </motion.div>
        )}

        {/* Messages */}
        {activeRepo &&
          messages.map((msg, i) => {
            const isUser = msg.sender === "user";

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* AI Avatar */}
                {!isUser && (
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl 
                      bg-[#111317] border border-[#22262b] shadow-md">
                    <Bot size={20} className="text-[#3B82F6]" />
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`
                    max-w-[75%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed
                    tracking-wide whitespace-pre-wrap break-words
                    shadow-[0_4px_20px_-6px_rgba(0,0,0,0.45)]
                    backdrop-blur-xl
                    ${
                      isUser
                        ? "bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-white border border-blue-500/20 rounded-br-none"
                        : "bg-[#13161A]/70 text-gray-200 border border-[#1f2327] rounded-bl-none"
                    }
                  `}
                >
                  {msg.text}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl 
                      bg-[#16181d] border border-[#2a2d33] shadow-sm">
                    <User size={20} className="text-white/80" />
                  </div>
                )}
              </motion.div>
            );
          })}
      </div>

      {isImporting && <RepoImportProgress progress={progress} />}

      {/* INPUT AREA */}
      <div className="sticky bottom-0 w-full px-4 py-5 bg-[#0C0D10]/85 backdrop-blur-2xl 
          border-t border-[#16181d] shadow-[0_-8px_35px_-15px_rgba(0,0,0,0.65)]">

        <div className="max-w-3xl mx-auto flex flex-col gap-4">

          {/* Mode Switch */}
          <div className="relative bg-[#14171C]/80 border border-[#22252b] rounded-2xl p-1 flex shadow-lg backdrop-blur-xl">

            <motion.div
              layoutId="mode-switch"
              className="absolute top-1 bottom-1 bg-[#3B82F6]/25 rounded-xl shadow-inner"
              animate={{
                left: mode === "chat" ? "4px" : "calc(50% + 4px)",
                width: "calc(50% - 8px)",
              }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            />

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

          {/* Input Box */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="
              flex items-center gap-3 h-[58px] px-5
              bg-[#0F1115]/90 border border-[#22252b]
              rounded-2xl backdrop-blur-xl shadow-lg
              relative
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
              className="flex-1 bg-transparent outline-none text-gray-200 text-sm placeholder-gray-500"
            />

            <button
              onClick={mode === "chat" ? sendMessage : importRepo}
              disabled={
                (mode === "chat" && !activeRepo) ||
                !input.trim() ||
                isImporting
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

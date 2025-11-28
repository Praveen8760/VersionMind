

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRepo } from "../../context/RepoContext";

export default function DependencyInsightsModal({ isOpen, onClose }) {
  const { activeRepo } = useRepo();

  const [loading, setLoading] = useState(false);
  const [deps, setDeps] = useState([]);
  const [aiSummary, setAiSummary] = useState("");

  useEffect(() => {
    if (!isOpen || !activeRepo) return;

    setLoading(true);
    setDeps([]);
    setAiSummary("");

    axios
      .get(`http://localhost:3000/api/ai/deps/${activeRepo.id}`, {
        withCredentials: true,
      })
      .then((res) => {
        setDeps(res.data.dependencies || []);
        setAiSummary(res.data.aiSummary || "");
      })
      .catch(() => {
        setAiSummary("Failed to load dependency insights.");
      })
      .finally(() => setLoading(false));
  }, [isOpen, activeRepo]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="
          fixed inset-0 bg-black/50 backdrop-blur-xl
          flex items-center justify-center
          z-[9999]
        "
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >

        {/* MAIN MODAL */}
        <motion.div
          key="modal"
          className="
            w-[750px] max-w-[95%] max-h-[82vh]
            rounded-2xl bg-[#0f1114]/95
            backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]
            border border-white/10 overflow-hidden relative
          "
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* Close */}
          <button
            onClick={onClose}
            className="
              absolute top-4 right-4 p-2 rounded-full
              bg-white/10 hover:bg-white/20 transition
            "
          >
            <X size={18} className="text-gray-300" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-[#1c1f24]">
            <GitBranch size={20} className="text-cyan-400" />
            <h2 className="text-xl font-semibold text-cyan-400">
              Dependency Insights
            </h2>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[65vh] space-y-6 scrollbar-thin scrollbar-thumb-[#30343b]">

            {loading ? (
              <p className="text-gray-500 text-sm animate-pulse">
                Analyzing dependencies…
              </p>
            ) : deps.length === 0 ? (
              <p className="text-gray-500 text-sm">No dependencies found.</p>
            ) : (
              deps.map((d, i) => (
                <motion.div
                  key={i}
                  className="
                    bg-[#1a1e24] border border-[#23272f]
                    rounded-xl p-4 hover:bg-[#1e232b]
                    transition
                  "
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <p className="text-gray-200 text-sm font-medium mb-2">
                    {d.file}
                  </p>

                  {/* Imports */}
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">Imports:</p>
                    <div className="flex flex-wrap gap-2">
                      {d.imports.map((imp, idx) => (
                        <span
                          key={idx}
                          className="
                            px-2 py-1 rounded-md text-[11px] 
                            bg-blue-400/10 text-blue-300 border border-blue-400/20
                          "
                        >
                          {imp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Used By */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Used By:</p>
                    <div className="flex flex-wrap gap-2">
                      {d.usedBy.map((u, idx) => (
                        <span
                          key={idx}
                          className="
                            px-2 py-1 rounded-md text-[11px]
                            bg-green-400/10 text-green-300 border border-green-400/20
                          "
                        >
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))
            )}

            {/* AI Summary */}
            {aiSummary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1a1e24] border border-[#23272f] p-4 rounded-xl"
              >
                <p className="text-xs text-gray-500 mb-2">AI Overview</p>
                <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-line">
                  {aiSummary}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,

    // Portal into the global modal root
    document.getElementById("modal-root")
  );
}

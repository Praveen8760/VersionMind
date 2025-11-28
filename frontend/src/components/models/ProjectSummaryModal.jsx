

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRepo } from "../../context/RepoContext";

export default function ProjectSummaryModal({ isOpen, onClose }) {
  const { activeRepo } = useRepo();
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  /* ----------------------------------------------------------
     Load AI Summary when Modal Opens
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen || !activeRepo) return;

    setLoading(true);
    setSummary("");

    axios
      .get(`http://localhost:3000/api/ai/summary/${activeRepo.id}`, {
        withCredentials: true,
      })
      .then((res) => {
        setSummary(res.data.summary || "No summary available.");
      })
      .catch(() => {
        setSummary("❌ Unable to generate summary.");
      })
      .finally(() => setLoading(false));
  }, [isOpen, activeRepo]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {/* BACKDROP */}
      <motion.div
        key="backdrop"
        className="
          fixed inset-0 z-[9999]
          bg-black/45 backdrop-blur-2xl
          flex items-center justify-center
        "
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* MODAL */}
        <motion.div
          key="modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 25 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="
            w-[650px] max-w-[95%] max-h-[80vh]
            bg-gradient-to-br from-[#0e1014] to-[#13161a]
            border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.60)]
            rounded-2xl overflow-hidden relative backdrop-blur-xl
          "
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="
              absolute top-4 right-4 z-10
              w-9 h-9 flex items-center justify-center
              rounded-full bg-white/10 hover:bg-white/20
              transition shadow-lg backdrop-blur-sm
            "
          >
            <X size={18} className="text-gray-200" />
          </button>

          {/* HEADER */}
          <div className="px-6 pt-6 pb-4 border-b border-[#1d2127]/70">
            <h2 className="text-xl font-semibold text-purple-400 tracking-wide">
              Project Summary
            </h2>
            <p className="text-gray-500 text-xs mt-1">
              AI-generated overview of your repository
            </p>
          </div>

          {/* CONTENT */}
          <div className="p-6 overflow-y-auto max-h-[62vh] scrollbar-thin scrollbar-thumb-[#2e323a] space-y-4">
            {loading ? (
              <div className="space-y-3">
                <div className="h-3 w-40 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-56 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
              </div>
            ) : (
              <p className="text-gray-300 whitespace-pre-line leading-relaxed text-sm">
                {summary}
              </p>
            )}
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t border-[#1d2127]/70 flex justify-end">
            <button
              onClick={onClose}
              className="
                px-5 py-2 rounded-lg text-sm
                bg-[#1a1e24] hover:bg-[#22272f]
                text-gray-200 transition shadow-sm
              "
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.getElementById("modal-root")
  );
}

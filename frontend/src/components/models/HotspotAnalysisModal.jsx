

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRepo } from "../../context/RepoContext";

export default function HotspotAnalysisModal({ isOpen, onClose }) {
  const { activeRepo } = useRepo();
  const [loading, setLoading] = useState(false);
  const [hotspots, setHotspots] = useState([]);
  const [aiSummary, setAiSummary] = useState("");

  /* ----------------------------------------------------------
     Fetch: Hotspot Data
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen || !activeRepo) return;

    setLoading(true);
    setHotspots([]);
    setAiSummary("");

    axios
      .get(`http://localhost:3000/api/ai/hotspots/${activeRepo.id}`, {
        withCredentials: true,
      })
      .then((res) => {
        setHotspots(res.data.hotspots || []);
        setAiSummary(res.data.aiSummary || "");
      })
      .catch(() => {
        setAiSummary("Unable to load hotspot analysis.");
      })
      .finally(() => setLoading(false));
  }, [isOpen, activeRepo]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-[9999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* MAIN MODAL */}
        <motion.div
          key="modal"
          className="
            w-[700px] max-w-[95%] max-h-[80vh]
            bg-[#0f1114]/95 border border-[#23272f]
            rounded-2xl overflow-hidden backdrop-blur-2xl
            shadow-[0_0_40px_rgba(0,0,0,0.5)]
          "
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-full transition"
          >
            <X size={18} className="text-gray-300" />
          </button>

          {/* HEADER */}
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-[#1c1f24]">
            <Flame size={20} className="text-red-400" />
            <h2 className="text-xl font-semibold text-red-400">
              Hotspot Analysis
            </h2>
          </div>

          {/* BODY */}
          <div className="p-6 overflow-y-auto max-h-[65vh] space-y-6 scrollbar-thin scrollbar-thumb-[#292d34]">
            {loading ? (
              <p className="text-gray-500 text-sm animate-pulse">
                Analyzing hotspots…
              </p>
            ) : hotspots.length === 0 ? (
              <p className="text-gray-500 text-sm">No hotspots detected.</p>
            ) : (
              <>
                {/* Hotspot Cards */}
                {hotspots.map((spot, index) => (
                  <motion.div
                    key={index}
                    className="
                      bg-[#1a1e24] border border-[#23272f]
                      rounded-xl p-4 hover:bg-[#1e232b] transition
                    "
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-gray-200 text-sm font-medium">
                        {spot.file}
                      </p>
                      <span
                        className="
                          text-red-400 text-xs bg-red-400/10 
                          px-2 py-1 rounded-md border border-red-400/20
                        "
                      >
                        Score: {spot.score}
                      </span>
                    </div>

                    {/* Issues */}
                    <ul className="text-gray-400 text-xs list-disc ml-5 space-y-1">
                      {spot.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>

                    {/* AI Fix Suggestion */}
                    <div className="mt-3 text-xs bg-[#15181e] border border-[#23272f] p-3 rounded-lg text-gray-300">
                      <span className="text-red-300 font-medium">AI Suggestion:</span>{" "}
                      {spot.aiFix}
                    </div>
                  </motion.div>
                ))}

                {/* AI Summary */}
                {aiSummary && (
                  <div className="bg-[#1a1e24] border border-[#23272f] p-4 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1">AI Overview</p>
                    <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                      {aiSummary}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.getElementById("modal-root")
  );
}

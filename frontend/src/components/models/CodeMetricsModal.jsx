
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRepo } from "../../context/RepoContext";

export default function CodeMetricsModal({ isOpen, onClose }) {
  const { activeRepo } = useRepo();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);

  /* ----------------------------------------------------------
     Fetch Metrics from Backend
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen || !activeRepo) return;

    setLoading(true);
    setMetrics(null);

    axios
      .get(`http://localhost:3000/api/ai/metrics/${activeRepo.id}`, {
        withCredentials: true,
      })
      .then((res) => setMetrics(res.data))
      .catch(() =>
        setMetrics({ error: "Unable to load metrics. Try again later." })
      )
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
          bg-black/50 backdrop-blur-xl
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
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="
            w-[650px] max-w-[95%] max-h-[78vh]
            bg-gradient-to-br from-[#0d0f12]/90 to-[#121418]/90
            border border-[#23272f]
            rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.55)]
            backdrop-blur-2xl overflow-hidden relative
          "
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="
              absolute top-4 right-4
              w-9 h-9 flex items-center justify-center
              rounded-full bg-white/10 hover:bg-white/20
              transition backdrop-blur-md
            "
          >
            <X size={18} className="text-gray-300" />
          </button>

          {/* HEADER */}
          <div className="px-6 pt-6 pb-3 border-b border-[#1a1d22] flex items-center gap-3">
            <BarChart3 size={20} className="text-blue-400" />
            <h2 className="text-xl font-semibold text-blue-400 tracking-wide">
              Code Metrics
            </h2>
          </div>

          {/* CONTENT */}
          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5 scrollbar-thin scrollbar-thumb-[#292d34]">
            {loading ? (
              <p className="text-gray-500 animate-pulse text-sm">
                Calculating repository metrics…
              </p>
            ) : metrics?.error ? (
              <p className="text-red-400 text-sm">{metrics.error}</p>
            ) : metrics ? (
              <>
                {/* Languages */}
                <div>
                  <p className="text-gray-400 text-xs mb-1">Languages Used</p>
                  <div className="text-gray-200 text-sm bg-[#1a1e24] p-3 rounded-xl border border-[#23272f]">
                    {Object.entries(metrics.languages).map(([lang, count]) => (
                      <p key={lang}>
                        {lang} — {count} files
                      </p>
                    ))}
                  </div>
                </div>

                {/* Basic Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <MetricBox label="Total Files" value={metrics.totalFiles} />
                  <MetricBox label="Total Lines" value={metrics.totalLines} />
                  <MetricBox
                    label="Avg Complexity"
                    value={metrics.complexity?.average}
                  />
                </div>

                {/* Worst File */}
                <div>
                  <p className="text-gray-400 text-xs mb-1">Most Complex File</p>
                  <div className="text-gray-300 text-sm bg-[#1a1e24] p-3 rounded-xl border border-[#23272f]">
                    {metrics.complexity?.worstFile || "None"}
                  </div>
                </div>

                {/* Top Complex Files */}
                <div>
                  <p className="text-gray-400 text-xs mb-1">
                    Top Complex Files (AI identified)
                  </p>
                  <div className="bg-[#1a1e24] p-3 rounded-xl border border-[#23272f] text-sm text-gray-300 space-y-1">
                    {metrics.topComplexFiles?.map((f, i) => (
                      <p key={i}>
                        {i + 1}. {f.file} — <span className="text-red-400">{f.score}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* AI Insights */}
                <div>
                  <p className="text-gray-400 text-xs mb-1">AI Insights</p>
                  <div className="bg-[#1a1e24] p-3 rounded-xl border border-[#23272f] text-sm text-gray-300 whitespace-pre-line">
                    {metrics.aiInsights || "No insights available."}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.getElementById("modal-root")
  );
}

/* ----------------------------------------------------------
   Small Reusable Box Component
----------------------------------------------------------- */
function MetricBox({ label, value }) {
  return (
    <div className="bg-[#1a1e24] p-3 rounded-xl border border-[#23272f] text-center">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-gray-200 text-base font-semibold">{value}</p>
    </div>
  );
}

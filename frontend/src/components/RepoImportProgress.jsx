
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FileCode, FileText, SquareStack, Brain } from "lucide-react";

export default function RepoImportProgress({ progress }) {
  if (!progress) return null;

  const isCode = progress.isCode || false;
  const modelName =
    progress.model || (isCode ? "mxbai-embed-large" : "nomic-embed-text");

  return (
    <AnimatePresence>
      {/* BACKDROP */}
      <motion.div
        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* MODAL */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="
            relative w-[90%] max-w-lg p-7 rounded-3xl
            bg-[#0d0f13]/90 backdrop-blur-2xl
            border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]
          "
        >
          {/* GLOW RING */}
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-[#3B82F680] to-transparent blur-3xl opacity-20"></div>

          {/* HEADER */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="
              w-10 h-10 rounded-2xl flex items-center justify-center
              bg-[#11151c] border border-[#1f2329]
              "
            >
              <Loader2 className="animate-spin text-[#3B82F6]" size={20} />
            </div>

            <h3 className="text-[1.05rem] font-semibold text-gray-200">
              {progress.message || "Importing Repository…"}
            </h3>
          </div>

          {/* FILE INFO */}
          {progress.file && (
            <div className="flex items-center gap-2 text-gray-300 text-sm mb-3">
              {isCode ? (
                <FileCode size={16} className="text-blue-400" />
              ) : (
                <FileText size={16} className="text-green-400" />
              )}
              <span className="truncate">{progress.file}</span>
            </div>
          )}

          {/* MODEL INFO */}
          <div className="flex items-center gap-2 mb-3">
            <Brain size={16} className="text-purple-400" />
            <p className="text-xs text-gray-400">
              Model:{" "}
              <span className="text-gray-300 font-medium">{modelName}</span>
            </p>
          </div>

          {/* CHUNK + FILE COUNTERS */}
          <div className="flex justify-between mb-4 text-xs text-gray-500">
            {progress.chunkTotal > 0 && (
              <div className="flex items-center gap-1">
                <SquareStack size={12} />
                <span>
                  Chunk {progress.chunkIndex}/{progress.chunkTotal}
                </span>
              </div>
            )}

            {progress.fileTotal > 0 && (
              <span>
                File {progress.fileIndex}/{progress.fileTotal}
              </span>
            )}
          </div>

          {/* PROGRESS BAR */}
          <div className="relative w-full h-4 rounded-xl overflow-hidden bg-[#0b0d10] border border-[#1b1e23] shadow-inner">
            {/* Glow stripes */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#18202b] to-[#090b0f] opacity-40" />

            <motion.div
              animate={{ width: `${progress.percent}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`
                h-full rounded-xl relative
                bg-gradient-to-r 
                ${
                  isCode
                    ? "from-blue-600 via-blue-400 to-blue-300"
                    : "from-green-600 via-green-400 to-green-300"
                }
              `}
            >
              {/* shimmer effect */}
              <motion.div
                animate={{ x: ["-25%", "130%"] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                  ease: "easeInOut",
                }}
                className="absolute top-0 bottom-0 w-12 bg-white/25 blur-xl opacity-50"
              />
            </motion.div>
          </div>

          {/* PERCENT TEXT */}
          <p className="text-xs text-gray-400 text-right mt-2 tracking-wide">
            {progress.percent.toFixed(0)}%
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

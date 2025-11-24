
// src/components/RepoImportProgress.jsx

import { motion } from "framer-motion";
import { Loader2, FileCode, SquareStack } from "lucide-react";

export default function RepoImportProgress({ progress }) {
  if (!progress) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="
        w-full rounded-2xl p-5 mb-4 
        bg-[#0F1115]/80 backdrop-blur-2xl 
        border border-[#1f2327] 
        shadow-[0_8px_30px_-10px_rgba(0,0,0,0.6)]
      "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="text-[#3B82F6] animate-spin" size={18} />
          <p className="text-sm font-semibold text-[#3B82F6] tracking-wide">
            {progress.message || "Importing Repository…"}
          </p>
        </div>
      </div>

      {/* FILE NAME */}
      {progress.file && (
        <div className="flex items-center gap-2 my-1 text-gray-400">
          <FileCode size={14} className="text-gray-500" />
          <p className="text-xs truncate text-gray-300">
            {progress.file}
          </p>
        </div>
      )}

      {/* CHUNK + FILE ROW */}
      <div className="flex justify-between mt-1 mb-3">
        {progress.chunkTotal > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <SquareStack size={12} />
            <span>
              Chunk {progress.chunkIndex}/{progress.chunkTotal}
            </span>
          </div>
        )}

        {progress.fileTotal > 0 && (
          <p className="text-[11px] text-gray-500">
            File {progress.fileIndex}/{progress.fileTotal}
          </p>
        )}
      </div>

      {/* PROGRESS BAR */}
      <div className="w-full bg-[#0c0d11] h-3 rounded-lg overflow-hidden relative shadow-inner">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e2633] to-[#111318] opacity-60" />

        {/* Animated Fill */}
        <motion.div
          animate={{ width: `${progress.percent}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="
            h-full rounded-lg relative
            bg-gradient-to-r 
            from-[#2563EB] 
            via-[#3B82F6] 
            to-[#60A5FA]
          "
        >
          {/* Soft moving shine */}
          <motion.div
            animate={{ x: ["-20%", "120%"] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            className="
              absolute top-0 bottom-0 w-10 
              bg-white/25 blur-md opacity-30 
            "
          />
        </motion.div>
      </div>

      {/* PERCENT */}
      <p className="text-xs text-gray-400 text-right mt-2">
        {progress.percent.toFixed(0)}%
      </p>
    </motion.div>
  );
}

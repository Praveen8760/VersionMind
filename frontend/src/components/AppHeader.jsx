

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function AppHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="
        sticky top-0 z-20
        h-[66px]
        bg-[#0E1013]/80 backdrop-blur-xl
        border-b border-[#1a1d22]
        flex items-center justify-center
        shadow-[0_4px_20px_-8px_rgba(0,0,0,0.45)]
        relative
      "
    >
      {/* Subtle glow behind brand */}
      <div className="
        absolute inset-0 
        bg-gradient-to-b from-[#3B82F6]/5 to-transparent 
        pointer-events-none
      " />

      {/* Brand Container */}
      <div className="flex items-center gap-3 select-none relative">

        {/* Icon */}
        <div
          className="
            w-[38px] h-[38px] flex items-center justify-center
            bg-[#111318] border border-[#21252c]
            rounded-xl
            shadow-[0_0_14px_rgba(59,130,246,0.18)]
          "
        >
          <Zap size={18} className="text-[#3B82F6]" />
        </div>

        {/* Text */}
        <h1 className="text-[22px] font-semibold tracking-tight">
          Version<span className="text-[#3B82F6]">Mind</span>
        </h1>
      </div>
    </motion.header>
  );
}

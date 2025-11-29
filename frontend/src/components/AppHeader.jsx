
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function AppHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="
        sticky top-0 z-30
        h-[68px]
        bg-[#0C0E11]/70
        backdrop-blur-2xl
        border-b border-[#1a1d22]/70
        shadow-[0_4px_24px_-4px_rgba(0,0,0,0.55)]
        flex items-center justify-center
        relative
      "
    >

      {/* Soft ambient glow */}
      <div
        className="
          absolute inset-0
          bg-gradient-to-b from-[#3B82F6]/10 via-transparent to-transparent
          pointer-events-none
        "
      />

      {/* Header Content */}
      <div className="flex items-center gap-3 relative select-none">

        {/* Brand Icon Box */}
        <motion.div
          whileHover={{ scale: 1.06 }}
          transition={{ type: "spring", stiffness: 210, damping: 14 }}
          className="
            w-[42px] h-[42px]
            flex items-center justify-center
            rounded-xl
            bg-[#121418]
            border border-[#242830]
            shadow-[0_0_18px_rgba(59,130,246,0.20)]
          "
        >
          <Zap size={20} className="text-[#3B82F6]" />
        </motion.div>

        {/* Branding Text */}
        <h1 className="text-[23px] font-semibold tracking-tight flex items-center gap-1">
          Version
          <span className="text-[#3B82F6] font-bold">Mind</span>
        </h1>
      </div>
    </motion.header>
  );
}

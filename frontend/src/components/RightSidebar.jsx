import { motion } from "framer-motion";

export default function RightSidebar() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="
        w-[260px] min-w-[260px] 
        min-h-full      /* FULL HEIGHT FIX */
        flex flex-col   /* MUST for vertical layout */
        bg-[#0F1115]/70 backdrop-blur-xl 
        border-l border-[#1c1f24]
        p-4
        relative
      "
    >
      {/* Vertical soft blue glow line */}
      <div
        className="
          absolute left-0 top-0 h-full w-[1px]
          bg-gradient-to-b from-transparent via-[#3B82F6]/30 to-transparent
        "
      />

      {/* Title */}
      <h2 className="text-lg font-semibold mb-4">Activity</h2>

      {/* CONTENT BLOCKS */}
      <div className="space-y-3 flex-1">

        {/* Placeholder Card */}
        <div
          className="
            bg-[#14171C]/70 p-4 rounded-xl 
            border border-[#1f2327]
            shadow-[inset_0_0_20px_rgba(0,0,0,0.35)]
          "
        >
          <p className="text-sm text-gray-400">
            No activity available.
          </p>
        </div>

        {/* Placeholder Card */}
        <div
          className="
            bg-[#14171C]/70 p-4 rounded-xl 
            border border-[#1f2327]
            shadow-[inset_0_0_20px_rgba(0,0,0,0.35)]
          "
        >
          <p className="text-sm text-gray-400">
            This panel will display insights, info, history, etc.
          </p>
        </div>
      </div>

    </motion.div>
  );
}

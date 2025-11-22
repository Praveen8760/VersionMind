

import { motion } from "framer-motion";
import { Github, Zap } from "lucide-react";

export default function Login() {
  return (
    <div className="relative min-h-screen w-full bg-[#0B0D10] flex items-center justify-center overflow-hidden">

      {/* --- GRID BACKGROUND --- */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#15181d_1px,transparent_1px),linear-gradient(to_bottom,#15181d_1px,transparent_1px)] bg-[size:38px_38px] opacity-[0.12]" />

      {/* --- NOISE TEXTURE --- */}
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* --- BLUE SIGNATURE GLOW --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ duration: 1.2 }}
        className="absolute w-[700px] h-[700px] bg-[#3B82F6] blur-[220px] rounded-full -top-40 -right-32 opacity-30"
      />

      {/* --- LOGIN CARD --- */}
      <motion.div
        initial={{ opacity: 0, y: 45 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-10 w-[430px] px-10 py-12 rounded-3xl 
                   bg-[#0F1115]/80 backdrop-blur-[20px] 
                   border border-[#1a1d21] shadow-[0_8px_40px_-10px_rgba(0,0,0,0.7)]"
      >

        {/* --- LOGO (THUNDER) --- */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="flex justify-center mb-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#111318] border border-[#22262c] flex items-center justify-center shadow-[0px_0px_18px_rgba(59,130,246,0.25)]">
            <Zap size={34} className="text-[#3B82F6]" />
          </div>
        </motion.div>

        {/* --- BRAND NAME --- */}
        <motion.h1
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="text-4xl font-semibold tracking-tight text-center text-white"
        >
          Version<span className="text-[#3B82F6]">Mind</span>
        </motion.h1>

        {/* --- SUBTITLE --- */}
        <p className="text-gray-400 text-center mt-3 mb-10">
          Lightning-fast AI for your codebase.
        </p>

        {/* --- LOGIN BUTTON --- */}
        <motion.a
          href="http://localhost:3000/auth/github"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="
            w-full flex items-center justify-center gap-3 
            py-3.5 rounded-xl 
            bg-[#14171c] text-white text-lg font-medium 
            border border-[#262a30]
            hover:border-[#3B82F6] hover:bg-[#1b1f25]
            transition-all duration-200 shadow-[0_0_20px_rgba(0,0,0,0.4)]
          "
        >
          <Github size={22} />
          Sign in with GitHub
        </motion.a>

        {/* FOOTNOTE */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Secure OAuth • Zero passwords stored
        </p>
      </motion.div>
    </div>
  );
}

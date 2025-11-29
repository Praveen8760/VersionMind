
 import { motion } from "framer-motion";
import { Github, Zap } from "lucide-react";

export default function Login() {
  return (
    <div className="relative min-h-screen w-full bg-[#0B0D10] flex items-center justify-center overflow-hidden text-white">

      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0E1117] to-[#0B0D10] opacity-95" />

      {/* Very soft grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:42px_42px]" />

      {/* Noise layer */}
      <div className="absolute inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Soft radial highlight */}
      <div className="absolute w-[600px] h-[600px] bg-[#3B82F6]/20 blur-[160px] rounded-full -top-40 -right-32" />

      {/* LOGIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="
          relative z-10 w-[420px] max-w-[90%] px-10 py-12
          rounded-2xl bg-[#0F1115]/40 backdrop-blur-xl
          border border-[#1a1d21]
          shadow-[0_20px_40px_-20px_rgba(0,0,0,0.55)]
        "
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="
            w-14 h-14 rounded-xl bg-[#101317] border border-[#1f2126]
            flex items-center justify-center
            shadow-[0_0_12px_rgba(255,255,255,0.05)]
          ">
            <Zap size={26} className="text-[#3B82F6]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-semibold text-center tracking-tight">
          Version<span className="text-[#3B82F6]">Mind</span>
        </h1>

        <p className="text-gray-400 text-center mt-3 mb-10 text-sm">
          Sign in to continue to your workspace.
        </p>

        {/* GitHub Login */}
        <motion.a
          href="http://localhost:3000/auth/github"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="
            w-full flex items-center justify-center gap-3
            py-3.5 rounded-xl
            bg-[#111417] border border-[#1f2328]
            hover:bg-[#15181d]
            transition-all duration-200
            text-white text-sm font-medium
          "
        >
          <Github size={20} />
          Continue with GitHub
        </motion.a>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8">
          Secure OAuth • No password stored
        </p>
      </motion.div>
    </div>
  );
}

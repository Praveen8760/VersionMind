
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  GitBranch,
  FolderGit2,
  Loader2,
  FileCode,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useRepo } from "../context/RepoContext";

export default function LeftSidebar() {
  const { user, logout } = useAuth();
  const { repos, activeRepo, setActiveRepo, loadingRepos } = useRepo();

  const [openProfile, setOpenProfile] = useState(false);

  return (
    <div className="
      min-h-full w-[270px]
      bg-[#0C0D10]/90 backdrop-blur-2xl
      border-r border-[#1a1d22]
      flex flex-col relative
      shadow-[4px_0_20px_-10px_rgba(0,0,0,0.4)]
    ">

      {/* Divider Glow */}
      <div className="absolute right-0 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-[#3B82F6]/40 to-transparent" />

      {/* Header */}
      <div className="px-5 pt-6">
        <h2 className="text-xs font-semibold tracking-[0.14em] text-gray-500 uppercase">
          Your Repositories
        </h2>
      </div>

      {/* Repo List */}
      <div className="mt-4 px-4 overflow-y-auto flex-1 space-y-3">

        {/* Loading */}
        {loadingRepos && (
          <div className="flex flex-col items-center mt-10 gap-2 text-gray-500">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm">Fetching repositories…</span>
          </div>
        )}

        {/* Empty state */}
        {!loadingRepos && repos.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-10">
            No repositories imported yet.
          </p>
        )}

        {/* Repo Cards */}
        {!loadingRepos &&
          repos.map((repo) => {
            const isActive = activeRepo?.id === repo._id;

            const statusColor = {
              ready: "text-green-400 bg-green-400/10",
              importing: "text-yellow-400 bg-yellow-400/10",
              error: "text-red-400 bg-red-400/10",
            }[repo.status];

            return (
              <motion.div
                key={repo._id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  setActiveRepo({
                    id: repo._id,
                    name: repo.repoName,
                  })
                }
                className={`
                  p-4 rounded-xl cursor-pointer border
                  bg-[#13161A]/50 hover:bg-[#15191f] mt-3
                  transition-all duration-200 flex flex-col gap-2

                  ${
                    isActive
                      ? "border-[#3B82F6] shadow-[0_0_15px_rgba(59,130,246,0.35)]"
                      : "border-[#1f2226]/50 hover:border-[#2a2e33]"
                  }
                `}
              >
                {/* Top: Name */}
                <div className="flex items-center gap-2">
                  <FolderGit2 size={18} className="text-[#3B82F6]" />
                  <p className="text-[15px] font-medium truncate">
                    {repo.repoName}
                  </p>
                </div>

                {/* Middle: Branch + Status */}
                <div className="flex items-center justify-between">
                  {/* Branch */}
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <GitBranch size={13} />
                    {repo.branch || "main"}
                  </div>

                  {/* Status badge */}
                  <span
                    className={`
                      text-[10px] px-2 py-0.5
                      rounded-full font-semibold tracking-wide
                      ${statusColor}
                    `}
                  >
                    {repo.status}
                  </span>
                </div>

                {/* Bottom: File count */}
                {repo.fileCount !== undefined && (
                  <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                    <FileCode size={12} />
                    {repo.fileCount} files indexed
                  </div>
                )}
              </motion.div>
            );
          })}
      </div>

      {/* Profile Section */}
      <div className="px-4 pb-6">
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setOpenProfile(true)}
          className="
            p-3 rounded-xl cursor-pointer transition-all
            flex items-center justify-between
            bg-[#13161B]/60 hover:bg-[#171b20]
            border border-[#24272E]/50 hover:border-[#2E3239]
            shadow-sm
          "
        >
          {/* Left: Avatar + name */}
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar}
              className="
                w-10 h-10 rounded-xl object-cover
                border border-[#22262c] shadow-sm
              "
            />
            <div className="leading-tight">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-[11px] text-gray-500">View Profile</p>
            </div>
          </div>

          {/* Right arrow */}
          <svg
            width="16"
            height="16"
            stroke="#3B82F6"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 3l6 5-6 5" />
          </svg>
        </motion.div>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {openProfile && (
          <motion.div
            onClick={() => setOpenProfile(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 180 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="
                w-full max-w-sm
                bg-[#0C0D10]/95 border border-[#1c1f24]
                rounded-t-3xl p-7 shadow-2xl backdrop-blur-xl
              "
            >
              <h2 className="text-lg font-semibold mb-4">Account</h2>

              <div className="flex items-center gap-4 mb-8">
                <img
                  src={user?.avatar}
                  className="w-14 h-14 rounded-xl border border-[#22262c]"
                />
                <div>
                  <p className="text-base font-medium">{user?.name}</p>
                  <p className="text-gray-500 text-sm">Logged in</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="
                  w-full flex items-center justify-center gap-3 px-4 py-3
                  rounded-xl bg-[#14171C]
                  hover:bg-[#1a1f24]
                  border border-[#24272E]
                  text-sm font-medium transition-all
                "
              >
                <LogOut size={18} className="text-[#3B82F6]" />
                Sign Out
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

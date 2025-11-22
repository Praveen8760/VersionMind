import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, GitBranch } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useRepo } from "../context/RepoContext";

export default function LeftSidebar() {
  const { user, logout } = useAuth();
  const { repos, activeRepo, setActiveRepo, loadingRepos } = useRepo();

  const [openProfile, setOpenProfile] = useState(false);

  return (
    <div
      className="
        min-h-full w-[250px]
        bg-[#0F1115]/80 backdrop-blur-2xl
        border-r border-[#1d2127]
        flex flex-col relative
        shadow-[4px_0_20px_-10px_rgba(0,0,0,0.4)]
      "
    >
      {/* Vertical Glow */}
      <div className="absolute right-0 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-[#3B82F6]/30 to-transparent" />

      {/* Title */}
      <div className="mt-6 px-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
        Repositories
      </div>

      {/* REPO LIST */}
      <div className="mt-3 px-3 space-y-2 overflow-y-auto flex-1">

        {loadingRepos && (
          <p className="text-gray-500 text-sm text-center mt-4">Loading...</p>
        )}

        {!loadingRepos && repos.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-4">
            No repositories imported.
          </p>
        )}

        {!loadingRepos &&
          repos.map((repo) => (
            <motion.div
              key={repo.repoId}
              onClick={() => setActiveRepo(repo.repoId)}
              whileTap={{ scale: 0.97 }}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-xl
                cursor-pointer transition-all border

                ${
                  activeRepo === repo.repoId
                    ? "bg-[#14171C] border-[#3B82F6] shadow-[0_0_12px_rgba(59,130,246,0.28)]"
                    : "bg-[#14171C]/40 hover:bg-[#14171C]/80 border-transparent hover:border-[#24272E]"
                }
              `}
            >
              <GitBranch size={16} className="text-[#3B82F6]" />
              <span className="text-sm font-medium truncate">
                {repo.repoName}
              </span>
            </motion.div>
          ))}
      </div>

      {/* PROFILE SECTION */}
      <div className="px-4 pb-4">
        <div
          onClick={() => setOpenProfile(true)}
          className="
            flex items-center gap-3 px-3 py-2
            rounded-xl cursor-pointer
            hover:bg-[#14171C] transition-all duration-200
            border border-transparent hover:border-[#24272E]
          "
        >
          <img
            src={user?.avatar}
            alt="profile"
            className="w-9 h-9 rounded-full border border-[#22262c]"
          />
          <div className="flex flex-col">
            <span className="text-sm">{user?.name}</span>
            <span className="text-xs text-gray-500">Profile</span>
          </div>
        </div>
      </div>

      {/* PROFILE MODAL */}
      <AnimatePresence>
        {openProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-end justify-center z-50"
            onClick={() => setOpenProfile(false)}
          >
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 130, damping: 18 }}
              className="
                w-full max-w-sm bg-[#0F1115]/95 border border-[#1c1f24]
                backdrop-blur-xl rounded-t-3xl p-6 shadow-xl
              "
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-4 tracking-tight">Account</h2>

              <div className="flex items-center gap-3 mb-6">
                <img
                  src={user?.avatar}
                  className="w-12 h-12 rounded-full border border-[#22262c]"
                />
                <div>
                  <h3 className="font-medium">{user?.name}</h3>
                  <p className="text-gray-400 text-sm">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="
                  w-full flex items-center justify-center gap-3 px-4 py-3
                  rounded-xl bg-[#14171C] hover:bg-[#1a1f24]
                  transition-all border border-[#24272E]
                  text-sm font-medium
                "
              >
                <LogOut size={18} className="text-[#3B82F6]" />
                Logout
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

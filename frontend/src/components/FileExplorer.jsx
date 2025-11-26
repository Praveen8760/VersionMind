

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, FileCode, ChevronRight } from "lucide-react";
import axios from "axios";

export default function FileExplorer({ repoId, onSelectFile }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState({});

  /* ======================================================
     LOAD FILE TREE (CORRECT ENDPOINT: /api/tree/:repoId)
  ====================================================== */
  useEffect(() => {
    if (!repoId) {
      console.log("[FileExplorer] ❌ No repoId provided");
      return;
    }

    console.log("[FileExplorer] 🚀 Fetching tree for repo:", repoId);
    setLoading(true);

    axios
      .get(`http://localhost:3000/api/tree/${repoId}`, {
        withCredentials: true,
      })
      .then((res) => {
        console.log("[FileExplorer] Raw response:", res.data);

        if (res.data.tree) {
          console.log(
            `[FileExplorer] ✔ Loaded ${res.data.tree.length} root nodes`
          );
          setTree(res.data.tree);
        } else {
          console.warn("[FileExplorer] ⚠ Unexpected API shape:", res.data);
          setTree([]);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("[FileExplorer] ❌ API Error:", err);
        setTree([]);
        setLoading(false);
      });
  }, [repoId]);

  /* Toggle folder open/close */
  const toggle = (path) =>
    setOpen((prev) => ({ ...prev, [path]: !prev[path] }));

  /* ======================================================
     RECURSIVE FILE/FOLDER RENDERING
  ====================================================== */
  const renderNode = (node, depth = 0) => {
    const isFolder = node.type === "folder";
    const expanded = open[node.path];

    return (
      <div key={node.path}>
        <button
          onClick={() => {
            if (isFolder) toggle(node.path);
            else onSelectFile && onSelectFile(node);
          }}
          className="
            flex items-center gap-2 w-full text-left 
            py-1.5 px-2 rounded-lg cursor-pointer
            hover:bg-[#1a1d22] transition
          "
          style={{ paddingLeft: depth * 14 }}
        >
          {/* Arrow */}
          {isFolder && (
            <ChevronRight
              size={14}
              className={`text-gray-500 transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
            />
          )}

          {/* Icon */}
          {isFolder ? (
            <Folder size={15} className="text-blue-400" />
          ) : (
            <FileCode size={15} className="text-gray-400" />
          )}

          {/* Name */}
          <span className="text-xs text-gray-300">{node.name}</span>
        </button>

        {/* Children */}
        {isFolder && expanded && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {node.children.map((child) =>
                renderNode(child, depth + 1)
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    );
  };

  /* ======================================================
     UI
  ====================================================== */
  return (
    <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#1e2227]">
      {loading ? (
        <div className="text-gray-500 text-xs p-5">Loading files…</div>
      ) : tree.length === 0 ? (
        <p className="text-gray-500 text-xs">No files found.</p>
      ) : (
        tree.map((n) => renderNode(n))
      )}
    </div>
  );
}

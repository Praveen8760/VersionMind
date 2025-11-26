

// src/components/FileExplorer.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, FileCode, ChevronRight, Search } from "lucide-react";
import axios from "axios";

/* -------------------------------------------------------------
   FILE EXTENSION COLORS
------------------------------------------------------------- */
const extColors = {
  js: "#FACC15",
  jsx: "#A855F7",
  ts: "#38BDF8",
  tsx: "#0EA5E9",
  json: "#F97316",
  css: "#22C55E",
  html: "#E11D48",
};

const getIconColor = (name) => {
  const ext = name.split(".").pop();
  return extColors[ext] || "#9CA3AF";
};

export default function FileExplorer({ repoId, onSelectFile }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [search, setSearch] = useState("");

  /* -------------------------------------------------------------
     LOAD TREE
------------------------------------------------------------- */
  useEffect(() => {
    if (!repoId) return;

    setLoading(true);
    axios
      .get(`http://localhost:3000/api/tree/${repoId}`, {
        withCredentials: true,
      })
      .then((res) => {
        setTree(res.data.tree || []);
      })
      .catch((err) => {
        console.error("❌ File tree error:", err);
        setTree([]);
      })
      .finally(() => setLoading(false));
  }, [repoId]);

  /* -------------------------------------------------------------
     FOLDER TOGGLE
------------------------------------------------------------- */
  const toggle = (path) =>
    setOpen((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));

  /* -------------------------------------------------------------
     RECURSIVE NODE RENDERER
------------------------------------------------------------- */
  const renderNode = (node, depth = 0) => {
    const isFolder = node.type === "folder";
    const expanded = open[node.path];

    // Search filter
    if (search && !node.name.toLowerCase().includes(search.toLowerCase())) {
      if (!isFolder) return null;
    }

    return (
      <div key={node.path}>
        {/* === ROW === */}
        <button
          onClick={() => {
            if (isFolder) toggle(node.path);
            else {
              setActiveFile(node.path);
              onSelectFile && onSelectFile(node);
            }
          }}
          className={`
            w-full flex items-center gap-2 
            rounded-lg transition-all py-1.5 px-2 text-left
            ${
              activeFile === node.path
                ? "bg-[#1e2633] border border-[#2f3845]"
                : "hover:bg-[#1a1e24]"
            }
          `}
          style={{
            paddingLeft: depth * 16,
            borderLeft: depth > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}
        >
          {/* Caret */}
          {isFolder && (
            <ChevronRight
              size={14}
              className={`text-gray-500 transition-transform duration-200 ${
                expanded ? "rotate-90" : ""
              }`}
            />
          )}

          {/* Icon */}
          {isFolder ? (
            <Folder size={15} className="text-blue-400" />
          ) : (
            <FileCode
              size={15}
              style={{ color: getIconColor(node.name) }}
            />
          )}

          {/* Name */}
          <span className="text-xs text-gray-300 truncate">{node.name}</span>
        </button>

        {/* === CHILDREN === */}
        {isFolder && expanded && node.children?.length > 0 && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
            >
              {node.children.map((child) => renderNode(child, depth + 1))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    );
  };

  /* -------------------------------------------------------------
     UI RENDER
------------------------------------------------------------- */
  return (
    <div className="flex flex-col h-full w-full">
      {/* Search Box */}
      <div className="mb-3 px-2 relative">
        <Search
          size={14}
          className="absolute left-3 top-2.5 text-gray-500"
        />
        <input
          placeholder="Search files..."
          onChange={(e) => setSearch(e.target.value)}
          className="
            w-full pl-8 pr-3 py-2 text-xs
            bg-[#14171c] border border-[#1f2329]
            rounded-lg text-gray-200
            focus:outline-none focus:border-blue-500/40
          "
        />
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#1f2329]">
        {loading ? (
          <p className="text-gray-500 text-xs p-3">Loading files…</p>
        ) : tree.length === 0 ? (
          <p className="text-gray-500 text-xs p-3">No files found.</p>
        ) : (
          tree.map((node) => renderNode(node))
        )}
      </div>
    </div>
  );
}

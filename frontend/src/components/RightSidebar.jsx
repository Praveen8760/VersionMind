

// src/components/RightSidebar.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Folder,
  FileCode,
  ChevronRight,
  BarChart2,
  GitBranch,
  StickyNote,
  Flame as FireIcon,
} from "lucide-react";

import axios from "axios";
import { useRepo } from "../context/RepoContext";
import FunctionGraph from "./FunctionGraph";
import ProjectSummaryModal from "./models/ProjectSummaryModal";
import CodeMetricsModal from "./models/CodeMetricsModal";
import HotspotAnalysisModal from "./models/HotspotAnalysisModal";
import DependencyInsightsModal from "./models/DependencyInsightsModal";



const SECTIONS = [
  { id: "explorer", label: "Files", icon: Folder, color: "#3B82F6" },
  { id: "insights", label: "Insights", icon: BarChart2, color: "#A855F7" },
  { id: "functions", label: "Functions", icon: GitBranch, color: "#22D3EE" },
  { id: "notes", label: "Notes", icon: StickyNote, color: "#FACC15" },
];

export default function RightSidebar() {
  const { activeRepo } = useRepo();

  const [activeSection, setActiveSection] = useState("explorer");
  const [fileTree, setFileTree] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);

  // model states
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showHotspotsModal, setShowHotspotsModal] = useState(false);  
  const [showDependencyModal, setShowDependencyModal] = useState(false);

  /* ---------------------------------------------------------
     LOAD FILE TREE WHEN:
     - Repo changes
     - Explorer tab is selected
  --------------------------------------------------------- */
  useEffect(() => {
    if (!activeRepo) {
      console.log("[RightSidebar] No active repo");
      return;
    }

    if (activeSection !== "explorer") return;

    console.log("[RightSidebar] Fetching file tree for repo:", activeRepo.id);
    setLoading(true);

    axios
      .get(`http://localhost:3000/api/tree/${activeRepo.id}`, {
        withCredentials: true,
      })
      .then((res) => {
        console.log("[RightSidebar] Tree:", res.data.tree);
        setFileTree(res.data.tree || []);
      })
      .catch((err) => {
        console.error("[RightSidebar] Tree fetch error:", err);
        setFileTree([]);
      })
      .finally(() => setLoading(false));
  }, [activeRepo, activeSection]);

  /* ---------------------------------------------------------
     FOLDER TOGGLE
  --------------------------------------------------------- */
  const toggle = (path) =>
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));

  /* ---------------------------------------------------------
     RENDER NODE RECURSIVELY
  --------------------------------------------------------- */
  const renderNode = (node, depth = 0) => {
    const open = expanded[node.path];
    const isFolder = node.type === "folder";

    return (
      <div key={node.path}>
        <div
          onClick={() => isFolder && toggle(node.path)}
          style={{ paddingLeft: depth * 16 }}
          className="
            flex items-center gap-2 cursor-pointer py-1 px-2
            hover:bg-[#1c2128] rounded-lg transition
          "
        >
          {isFolder && (
            <ChevronRight
              size={14}
              className={`text-gray-500 transition ${open ? "rotate-90" : ""}`}
            />
          )}

          {isFolder ? (
            <Folder size={16} className="text-blue-400" />
          ) : (
            <FileCode size={15} className="text-gray-400" />
          )}

          <span className="text-xs text-gray-300">{node.name}</span>
        </div>

        {/* children */}
        {isFolder && open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {node.children.map((child) => renderNode(child, depth + 1))}
          </motion.div>
        )}
      </div>
    );
  };

  /* ---------------------------------------------------------
     RIGHT CONTENT
  --------------------------------------------------------- */
  const renderContent = () => {
    if (!activeRepo)
      return (
        <p className="text-xs text-gray-500 p-2">
          Select a repo from the left sidebar.
        </p>
      );

    if (activeSection === "explorer") {
      if (loading)
        return <p className="text-xs text-gray-500 p-2">Loading files…</p>;

      if (!fileTree.length)
        return <p className="text-xs text-gray-500 p-2">No files found.</p>;

      return (
        <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-[#23272f]">
          {fileTree.map((node) => renderNode(node))}
        </div>
      );
    }

    if (activeSection === "insights")
      return (
        <div className="flex flex-col h-full">

          {/* Title */}
          <p className="text-lg font-semibold mb-4 text-purple-400">
            AI Insights
          </p>

          {/* Feature Buttons */}
          <div className="space-y-3 mb-4">

            {/* Summary */}
            <button
              className="
                w-full p-3 rounded-xl text-left
                bg-[#171b21]/60 border border-[#1f2329]
                hover:bg-[#1d222a] hover:border-[#2a2e33]
                transition flex items-center gap-3
              "
              onClick={() => setShowSummaryModal(true)}
            >
              <BarChart2 size={18} className="text-purple-400" />
              <span className="text-sm text-gray-200">Project Summary</span>
            </button>

            {/* Code Metrics */}
            <button
              className="
                w-full p-3 rounded-xl text-left
                bg-[#171b21]/60 border border-[#1f2329]
                hover:bg-[#1d222a] hover:border-[#2a2e33]
                transition flex items-center gap-3
              "
              onClick={() => setShowMetricsModal(true)}
            >
              <GitBranch size={18} className="text-blue-400" />
              <span className="text-sm text-gray-200">Code Metrics</span>
            </button>

            {/* Hotspot Analysis */}
            <button
              className="
                w-full p-3 rounded-xl text-left
                bg-[#171b21]/60 border border-[#1f2329]
                hover:bg-[#1d222a] hover:border-[#2a2e33]
                transition flex items-center gap-3
              "
              onClick={() => setShowHotspotsModal(true)}
            >
              <FireIcon size={18} className="text-red-400" />
              <span className="text-sm text-gray-200">Hotspot Analysis</span>
            </button>

            {/* Dependencies */}
            <button
              className="
                w-full p-3 rounded-xl text-left
                bg-[#171b21]/60 border border-[#1f2329]
                hover:bg-[#1d222a] hover:border-[#2a2e33]
                transition flex items-center gap-3
              "
              onClick={() => setShowDependencyModal(true)}
            >
              <GitBranch size={18} className="text-cyan-400" />
              <span className="text-sm text-gray-200">Dependency Insights</span>
            </button>

          </div>

          {/* Divider */}
          <div className="border-t border-[#1f2329] my-2"></div>

          {/* Export Section */}
          <p className="text-xs text-gray-500 mb-2">Export</p>

          <div className="space-y-2">

            <button
              className="
                w-full p-2 rounded-lg bg-[#13161a]
                border border-[#23272f] hover:bg-[#1a1e24]
                text-xs text-gray-300 transition
              "
              onClick={() => console.log('Export PDF')}
            >
              Export as PDF
            </button>

            <button
              className="
                w-full p-2 rounded-lg bg-[#13161a]
                border border-[#23272f] hover:bg-[#1a1e24]
                text-xs text-gray-300 transition
              "
              onClick={() => console.log('Export Markdown')}
            >
              Export as Markdown
            </button>

            <button
              className="
                w-full p-2 rounded-lg bg-[#13161a]
                border border-[#23272f] hover:bg-[#1a1e24]
                text-xs text-gray-300 transition
              "
              onClick={() => console.log('Export JSON')}
            >
              Export as JSON
            </button>

          </div>

        </div>
      );


    if (activeSection === "functions")
      return (
        <div className="flex-1">
          <FunctionGraph />
        </div>
      );

    if (activeSection === "notes")
      return (
        <div className="p-2 text-gray-300">
          <p className="text-lg mb-2 text-yellow-400">Notes</p>
          <textarea
            className="w-full h-40 p-3 rounded-xl bg-[#13161b] border border-[#22272f] text-xs text-gray-200"
            placeholder="Write notes…"
          />
        </div>
      );
  };

  /* ---------------------------------------------------------
     UI
  --------------------------------------------------------- */
  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="
        w-[300px] min-h-full flex flex-col
        bg-[#0d0f12]/90 border-l border-[#1d2026]
        p-5 backdrop-blur-xl relative 
      "
    >
      {/* Glow Divider */}
      <div className="absolute left-0 top-0 w-[2px] h-full bg-gradient-to-b from-transparent via-[#3B82F6]/40 to-transparent" />

      {/* TOOL BUTTONS */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {SECTIONS.map(({ id, label, icon: Icon, color }) => {
          const active = id === activeSection;

          return (
            <motion.div
              key={id}
              whileHover={{ scale: 1.05 }}
              onClick={() => setActiveSection(id)}
              className={`
                p-3 rounded-xl flex flex-col items-center cursor-pointer
                transition border shadow-md
                ${
                  active
                    ? "shadow-[0_0_18px_rgba(59,130,246,0.25)]"
                    : "bg-[#171b21]/60 border-[#1f2329] hover:bg-[#1c2026]"
                }
              `}
              style={{
                background: active
                  ? `linear-gradient(135deg, ${color}30, ${color}50)`
                  : undefined,
              }}
            >
              <Icon size={20} style={{ color: active ? color : "#8b8f95" }} />
              <span
                className="text-[11px]"
                style={{ color: active ? color : "#9ca3af" }}
              >
                {label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* CONTENT */}
      <div className="flex-1">{renderContent()}</div>

      <p className="text-center text-[10px] text-gray-600 mt-4">
        VersionMind • Tools
      </p>

      <ProjectSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
      />

      <CodeMetricsModal
        isOpen={showMetricsModal}
        onClose={() => setShowMetricsModal(false)}
      />

      <HotspotAnalysisModal
        isOpen={showHotspotsModal}
        onClose={() => setShowHotspotsModal(false)}
      />

      <DependencyInsightsModal
        isOpen={showDependencyModal}
        onClose={() => setShowDependencyModal(false)}
      />  

    </motion.div>
  );
}

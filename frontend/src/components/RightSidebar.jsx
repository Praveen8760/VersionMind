
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

  // modal states
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showHotspotsModal, setShowHotspotsModal] = useState(false);
  const [showDependencyModal, setShowDependencyModal] = useState(false);

  /* ---------------------------------------------------------
     Fetch file tree
  --------------------------------------------------------- */
  useEffect(() => {
    if (!activeRepo || activeSection !== "explorer") return;

    setLoading(true);
    axios
      .get(`http://localhost:3000/api/tree/${activeRepo.id}`, {
        withCredentials: true,
      })
      .then((res) => {
        setFileTree(res.data.tree || []);
      })
      .catch(() => setFileTree([]))
      .finally(() => setLoading(false));
  }, [activeRepo, activeSection]);

  /* ---------------------------------------------------------
     Folder toggler
  --------------------------------------------------------- */
  const toggle = (path) =>
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));

  /* ---------------------------------------------------------
     Render tree node
  --------------------------------------------------------- */
  const renderNode = (node, depth = 0) => {
    const open = expanded[node.path];
    const folder = node.type === "folder";

    return (
      <div key={node.path}>
        <div
          onClick={() => folder && toggle(node.path)}
          style={{ paddingLeft: depth * 16 }}
          className="
            flex items-center gap-2 cursor-pointer py-1 px-2
            hover:bg-[#1c2128] rounded-lg transition
          "
        >
          {folder && (
            <ChevronRight
              size={14}
              className={`text-gray-500 transition ${
                open ? "rotate-90" : ""
              }`}
            />
          )}

          {folder ? (
            <Folder size={16} className="text-blue-400" />
          ) : (
            <FileCode size={15} className="text-gray-400" />
          )}

          <span className="text-xs text-gray-300">{node.name}</span>
        </div>

        {folder && open && (
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
     Content Renderer
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
        return (
          <p className="text-xs text-gray-500 p-2">Loading files…</p>
        );

      if (!fileTree.length)
        return <p className="text-xs text-gray-500 p-2">No files found.</p>;

      return (
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#23272f]">
          {fileTree.map((node) => renderNode(node))}
        </div>
      );
    }

    if (activeSection === "insights") {
      return (
        <div className="flex flex-col flex-1 overflow-y-auto pr-1 space-y-3">

          <p className="text-lg font-semibold text-purple-400">
            AI Insights
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              className="w-full p-3 rounded-xl flex items-center gap-3 bg-[#15181c] border border-[#202328] hover:bg-[#1b1e23]"
              onClick={() => setShowSummaryModal(true)}
            >
              <BarChart2 size={18} className="text-purple-400" />
              <span className="text-sm text-gray-200">Project Summary</span>
            </button>

            <button
              className="w-full p-3 rounded-xl flex items-center gap-3 bg-[#15181c] border border-[#202328] hover:bg-[#1b1e23]"
              onClick={() => setShowMetricsModal(true)}
            >
              <GitBranch size={18} className="text-blue-400" />
              <span className="text-sm text-gray-200">Code Metrics</span>
            </button>

            <button
              className="w-full p-3 rounded-xl flex items-center gap-3 bg-[#15181c] border border-[#202328] hover:bg-[#1b1e23]"
              onClick={() => setShowHotspotsModal(true)}
            >
              <FireIcon size={18} className="text-red-400" />
              <span className="text-sm text-gray-200">Hotspot Analysis</span>
            </button>

            <button
              className="w-full p-3 rounded-xl flex items-center gap-3 bg-[#15181c] border border-[#202328] hover:bg-[#1b1e23]"
              onClick={() => setShowDependencyModal(true)}
            >
              <GitBranch size={18} className="text-cyan-400" />
              <span className="text-sm text-gray-200">
                Dependency Insights
              </span>
            </button>
          </div>

          <div className="border-t border-[#23272f] pt-3" />

          <p className="text-xs text-gray-500">Export</p>

          <button className="w-full p-2 rounded-lg bg-[#13161a] border border-[#23272f] text-xs text-gray-300 hover:bg-[#1a1e24]">
            Export as PDF
          </button>

          <button className="w-full p-2 rounded-lg bg-[#13161a] border border-[#23272f] text-xs text-gray-300 hover:bg-[#1a1e24]">
            Export as Markdown
          </button>

          <button className="w-full p-2 rounded-lg bg-[#13161a] border border-[#23272f] text-xs text-gray-300 hover:bg-[#1a1e24] mb-4">
            Export as JSON
          </button>
        </div>
      );
    }

    if (activeSection === "functions") {
      return (
        <div className="flex-1 overflow-y-auto pr-1">
          <FunctionGraph />
        </div>
      );
    }

    if (activeSection === "notes") {
      return (
        <div className="flex-1 overflow-y-auto pr-1 p-2">
          <p className="text-lg mb-2 text-yellow-400">Notes</p>
          <textarea
            className="w-full h-40 p-3 rounded-xl bg-[#13161b] border border-[#22272f] text-xs text-gray-200"
            placeholder="Write notes…"
          />
        </div>
      );
    }
  };

  /* ---------------------------------------------------------
     UI Layout (fixed height, scroll inside)
  --------------------------------------------------------- */
  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="
        w-[300px] h-full flex flex-col
        bg-[#0d0f12]/90 border-l border-[#1d2026]
        backdrop-blur-xl p-5 relative
      "
    >
      {/* Left glow divider */}
      <div className="absolute left-0 top-0 w-[2px] h-full bg-gradient-to-b from-transparent via-[#3B82F6]/40 to-transparent" />

      {/* SECTION BUTTONS */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {SECTIONS.map(({ id, label, icon: Icon, color }) => {
          const active = id === activeSection;
          return (
            <div
              key={id}
              onClick={() => setActiveSection(id)}
              className={`
                p-3 rounded-xl cursor-pointer flex flex-col items-center
                transition-all border
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
            </div>
          );
        })}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#2a2e35]">
        {renderContent()}
      </div>

      {/* Fixed Bottom Info */}
      <p className="text-center text-[10px] text-gray-600 mt-4">
        VersionMind • Tools
      </p>

      {/* Modals */}
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

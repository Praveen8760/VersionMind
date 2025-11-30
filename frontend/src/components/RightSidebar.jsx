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
  History,
} from "lucide-react";

import axios from "axios";
import { useRepo } from "../context/RepoContext";

import FunctionGraph from "./FunctionGraph";
import ProjectSummaryModal from "./models/ProjectSummaryModal";
import CodeMetricsModal from "./models/CodeMetricsModal";
import HotspotAnalysisModal from "./models/HotspotAnalysisModal";
import DependencyInsightsModal from "./models/DependencyInsightsModal";
import NotesPanel from "./NotesPanel"
import ReadmeGeneratorPanel from "./ReadmeGeneratorPanel";
import ChangelogPanel from "./ChangelogPanel";

/* Sidebar Sections */
const SECTIONS = [
  { id: "explorer", label: "Files", icon: Folder, color: "#3B82F6" },
  { id: "insights", label: "Insights", icon: BarChart2, color: "#A855F7" },
  { id: "functions", label: "Functions", icon: GitBranch, color: "#22D3EE" },
  { id: "notes", label: "Notes", icon: StickyNote, color: "#FACC15" },
  {id : "readme", label : "Readme", icon : FileCode, color : "#10B981"},
  { id: "changelog", label: "Changelog", icon: History, color: "#fb923c" },
];

export default function RightSidebar() {
  const { activeRepo } = useRepo();

  const [activeSection, setActiveSection] = useState("explorer");

  const [fileTree, setFileTree] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);

  // Modals
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showHotspotsModal, setShowHotspotsModal] = useState(false);
  const [showDependencyModal, setShowDependencyModal] = useState(false);

  /* ------------------------------------------------------------------
     FETCH FILE TREE
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!activeRepo || activeSection !== "explorer") return;

    setLoading(true);

    axios
      .get(`http://localhost:3000/api/tree/${activeRepo.id}`, {
        withCredentials: true,
      })
      .then((res) => setFileTree(res.data.tree || []))
      .catch(() => setFileTree([]))
      .finally(() => setLoading(false));
  }, [activeRepo, activeSection]);

  /* ------------------------------------------------------------------
     FOLDER TOGGLE
  ------------------------------------------------------------------ */
  const toggle = (path) =>
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));

  /* ------------------------------------------------------------------
     FILE TREE RENDERER
  ------------------------------------------------------------------ */
  const renderNode = (node, depth = 0) => {
    const open = expanded[node.path];
    const folder = node.type === "folder";

    return (
      <div key={node.path}>
        <div
          onClick={() => folder && toggle(node.path)}
          style={{ paddingLeft: depth * 16 }}
          className="flex items-center gap-2 py-1 px-2 cursor-pointer
                     hover:bg-[#1c2128] rounded-lg transition"
        >
          {folder && (
            <ChevronRight
              size={14}
              className={`text-gray-500 transition ${open ? "rotate-90" : ""}`}
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
            className="ml-1"
          >
            {node.children.map((child) => renderNode(child, depth + 1))}
          </motion.div>
        )}
      </div>
    );
  };

  /* ------------------------------------------------------------------
     SECTION CONTENT
  ------------------------------------------------------------------ */
  const renderContent = () => {
    if (!activeRepo)
      return (
        <p className="text-xs text-gray-500 p-2">
          Select a repository to continue.
        </p>
      );

    /* FILE EXPLORER */
    if (activeSection === "explorer") {
      if (loading)
        return <p className="text-xs text-gray-500 p-2">Loading files…</p>;

      if (!fileTree.length)
        return <p className="text-xs text-gray-500 p-2">No files found.</p>;

      return (
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#23272f]">
          <p className="text-xl font-semibold text-blue-400 mb-3">Files</p>
          {fileTree.map((node) => renderNode(node))}
        </div>
      );
    }

    /* INSIGHTS SECTION */
    if (activeSection === "insights") {
      return (
        <div className="flex flex-col flex-1 overflow-y-auto pr-1 space-y-3">
          <p className="text-lg font-semibold text-purple-400">AI Insights</p>

          {/* Insights buttons */}
          <div className="space-y-3">
            <InsightButton
              icon={<BarChart2 size={18} className="text-purple-400" />}
              label="Project Summary"
              onClick={() => setShowSummaryModal(true)}
            />

            <InsightButton
              icon={<GitBranch size={18} className="text-blue-400" />}
              label="Code Metrics"
              onClick={() => setShowMetricsModal(true)}
            />

            <InsightButton
              icon={<FireIcon size={18} className="text-red-400" />}
              label="Hotspot Analysis"
              onClick={() => setShowHotspotsModal(true)}
            />

            <InsightButton
              icon={<GitBranch size={18} className="text-cyan-400" />}
              label="Dependency Insights"
              onClick={() => setShowDependencyModal(true)}
            />
          </div>

          {/* Export */}
          <div className="border-t border-[#23272f] pt-3" />

          <p className="text-xs text-gray-500">Export</p>

          <ExportButton label="Export as PDF" />
          <ExportButton label="Export as Markdown" />
          <ExportButton label="Export as JSON" />
        </div>
      );
    }

    /* FUNCTION GRAPH */
    if (activeSection === "functions") {
      return (
        <div className="flex-1 overflow-y-auto pr-1">
          <FunctionGraph />
        </div>
      );
    }

    /* NOTES SECTION */
    if (activeSection === "notes") {
      return (
        <NotesPanel repoId={activeRepo.id} />
      );
    }

    if(activeSection == "readme"){
      return(
        <ReadmeGeneratorPanel repoId={activeRepo.id} />
      )
    }
    if(activeSection == "changelog"){
      return(
        <ChangelogPanel repoId={activeRepo.id} />
      )
    }
  };

  /* ------------------------------------------------------------------
     SIDEBAR LAYOUT
  ------------------------------------------------------------------ */
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
      {/* Blue glow divider */}
      <div className="absolute left-0 top-0 w-[2px] h-full bg-gradient-to-b from-transparent via-[#3B82F6]/40 to-transparent" />

      {/* Section buttons */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {SECTIONS.map(({ id, label, icon: Icon, color }) => {
          const active = id === activeSection;
          return (
            <SidebarButton
              key={id}
              active={active}
              color={color}
              icon={<Icon size={20} />}
              label={label}
              onClick={() => setActiveSection(id)}
            />
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#2a2e35]">
        {renderContent()}
      </div>

      {/* Bottom Label */}
      <p className="text-center text-[10px] text-gray-600 mt-4">
        VersionMind • Tools
      </p>

      {/* MODALS */}
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

/* ------------------------------------------------------------------
     SMALL COMPONENTS BELOW (clean UI)
------------------------------------------------------------------ */

function SidebarButton({ active, icon, label, color, onClick }) {
  return (
    <div
      onClick={onClick}
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
      {icon}
      <span
        className="text-[11px] mt-1"
        style={{ color: active ? color : "#9ca3af" }}
      >
        {label}
      </span>
    </div>
  );
}

function InsightButton({ icon, label, onClick }) {
  return (
    <button
      className="w-full p-3 rounded-xl flex items-center gap-3 bg-[#15181c]
                 border border-[#202328] hover:bg-[#1b1e23]"
      onClick={onClick}
    >
      {icon}
      <span className="text-sm text-gray-200">{label}</span>
    </button>
  );
}

function ExportButton({ label }) {
  return (
    <button className="w-full p-2 rounded-lg bg-[#13161a] border border-[#23272f] text-xs text-gray-300 hover:bg-[#1a1e24]">
      {label}
    </button>
  );
}

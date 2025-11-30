
import { useState } from "react";
import axios from "axios";
import {
  Loader2,
  Copy,
  Check,
  FileDown,
  History,
  GitCommit,
} from "lucide-react";

export default function ChangelogPanel({ repoId }) {
  const [loading, setLoading] = useState(false);
  const [commitHistory, setCommitHistory] = useState([]);
  const [changelog, setChangelog] = useState("");
  const [copied, setCopied] = useState(false);

  const generateChangelog = () => {
    if (!repoId) return;

    setLoading(true);
    setChangelog("");
    setCommitHistory([]);

    axios
      .get(`http://localhost:3000/api/changelog/${repoId}`, {
        withCredentials: true,
      })
      .then((res) => {
        setChangelog(res.data.changelog || "");
        setCommitHistory(res.data.commits || []);
      })
      .catch(() => setChangelog("Failed to generate changelog."))
      .finally(() => setLoading(false));
  };

  const copyText = () => {
    navigator.clipboard.writeText(changelog);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 px-3 pb-3">

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent drop-shadow-md">
          Changelog Generator
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Automatically generates a CHANGELOG.md + shows latest commits.
        </p>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateChangelog}
        disabled={loading}
        className="
          flex items-center justify-center gap-2
          px-4 py-2 mb-5 rounded-lg
          bg-gradient-to-r from-orange-600/50 to-orange-400/40
          border border-orange-500/30
          shadow-[0_0_20px_-6px_rgba(255,153,95,0.45)]
          text-orange-100 text-sm font-medium
          transition-all duration-200
          hover:scale-[1.02] hover:shadow-[0_0_30px_-4px_rgba(255,153,95,0.55)]
          active:scale-[0.97]
          disabled:opacity-40
        "
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <History />}
        {loading ? "Generating…" : "Generate Changelog"}
      </button>

      {/* Recent Commits */}
      {commitHistory.length > 0 && (
        <div className="mb-5">
          <p className="text-orange-400 font-medium mb-2 flex items-center gap-1">
            <GitCommit size={14} /> Recent Commits
          </p>

          <div className="max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#3a3f45] space-y-3">
            {commitHistory.map((c, idx) => (
              <div
                key={idx}
                className="
                  bg-[#14171c]/80 backdrop-blur-xl
                  border border-[#1e2227]
                  p-3 rounded-lg
                  hover:bg-[#181c21] transition
                  shadow-[0_2px_10px_-4px_rgba(0,0,0,0.4)]
                "
              >
                <p className="text-gray-200 text-[12px] font-medium leading-snug">
                  {c.message}
                </p>
                <p className="text-gray-500 text-[10px] mt-1">
                  {c.author} • {new Date(c.date).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      {changelog && !loading && (
        <div className="flex justify-between mb-3 px-1">
          {/* Copy */}
          <button
            onClick={copyText}
            className="
              flex items-center gap-1 px-3 py-1.5
              rounded-md bg-[#1a1f24]
              border border-[#2a3037]
              hover:bg-[#1f262c]
              transition text-xs text-gray-300
            "
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>

          {/* Download */}
          <button
            onClick={() => {
              const blob = new Blob([changelog], { type: "text/markdown" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "CHANGELOG.md";
              a.click();
            }}
            className="
              flex items-center gap-1 px-3 py-1.5
              rounded-md bg-[#1a1f24]
              border border-[#2a3037]
              hover:bg-[#1f262c]
              transition text-xs text-gray-300
            "
          >
            <FileDown size={14} />
            Download
          </button>
        </div>
      )}

      {/* Output Panel */}
      <div
        className="
          flex-1 rounded-xl border border-[#2a2d33]
          bg-[#0e1116]/70 backdrop-blur-xl
          shadow-[0_6px_25px_-10px_rgba(0,0,0,0.6)]
          p-4 text-sm text-gray-200
          overflow-y-auto scrollbar-thin scrollbar-thumb-[#3a3f45]
          whitespace-pre-wrap font-mono leading-relaxed
        "
      >
        {loading ? (
          <p className="text-gray-400 text-sm">Fetching latest commits…</p>
        ) : (
          <pre>{changelog}</pre>
        )}
      </div>
    </div>
  );
}



import { useState } from "react";
import axios from "axios";
import {
  Loader2,
  FileDown,
  Copy,
  Check,
  FileText,
} from "lucide-react";

export default function ReadmeGeneratorPanel({ repoId }) {
  const [loading, setLoading] = useState(false);
  const [readme, setReadme] = useState("");
  const [copied, setCopied] = useState(false);

  const generateReadme = () => {
    if (!repoId) return;

    setLoading(true);
    setReadme("");

    axios
      .get(`http://localhost:3000/api/ai/readme/${repoId}`, {
        withCredentials: true,
      })
      .then((res) => setReadme(res.data.readme || ""))
      .catch(() => setReadme("❌ Failed to generate README."))
      .finally(() => setLoading(false));
  };

  const copyText = () => {
    navigator.clipboard.writeText(readme);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 px-3 pb-3">

      {/* HEADER */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
          README Generator
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          AI-powered documentation generator for your repository.
        </p>
      </div>

      {/* GENERATE BUTTON */}
      <button
        onClick={generateReadme}
        disabled={loading}
        className="
          flex items-center gap-2 px-4 py-2 mb-4 rounded-lg
          bg-gradient-to-r from-emerald-600/60 to-emerald-500/40
          hover:from-emerald-600 hover:to-emerald-500
          border border-emerald-600/30
          shadow-[0_0_25px_-6px_rgba(16,185,129,0.4)]
          text-emerald-100 text-sm font-medium
          transition-all duration-200
          disabled:opacity-40
        "
      >
        {loading ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <FileText size={16} />
        )}
        {loading ? "Generating..." : "Generate README"}
      </button>

      {/* TOOLBAR */}
      {readme && !loading && (
        <div className="flex justify-between mb-2 px-1">

          <button
            onClick={copyText}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg
                       bg-[#1a1e24] border border-[#2c3038]
                       hover:bg-[#22272f] transition text-xs text-gray-300"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>

          <button
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg
                       bg-[#1a1e24] border border-[#2c3038]
                       hover:bg-[#22272f] transition text-xs text-gray-300"
            onClick={() => {
              const blob = new Blob([readme], { type: "text/markdown" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "README.md";
              link.click();
            }}
          >
            <FileDown size={14} />
            Download
          </button>
        </div>
      )}

      {/* OUTPUT */}
      <div
        className="
          flex-1 rounded-xl border border-[#2a2d33]
          bg-[#0e1116]/70 backdrop-blur-xl
          shadow-[0_8px_30px_-12px_rgba(0,0,0,0.4)]
          p-4 text-sm text-gray-200
          overflow-y-auto scrollbar-thin scrollbar-thumb-[#3a3f45]
          whitespace-pre-wrap font-mono leading-relaxed
        "
      >
        {loading ? (
          <p className="text-gray-400 text-sm">Generating README…</p>
        ) : (
          <pre>{readme}</pre>
        )}
      </div>
    </div>
  );
}

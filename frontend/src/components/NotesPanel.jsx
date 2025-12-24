
// src/components/NotesPanel.jsx

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function NotesPanel({ repoId }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef(null);

  /* ============================================================
     Load existing notes
  ============================================================ */
  useEffect(() => {
    if (!repoId) return;

    axios
      .get(`http://localhost:3000/api/notes/${repoId}`, { withCredentials: true })
      .then((res) => setNote(res.data.note || ""))
      .catch(() => setNote(""));
  }, [repoId]);

  /* ============================================================
     Auto Save on input (700ms debounce)
  ============================================================ */
  const handleChange = (e) => {
    const value = e.target.value;
    setNote(value);

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      setSaving(true);

      axios
        .post(
          "http://localhost:3000/api/notes/save",
          { repoId, note: value },
          { withCredentials: true }
        )
        .finally(() => setSaving(false));
    }, 700);
  };

  return (
    <div className="flex flex-col flex-1 p-1">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-yellow-400 tracking-wide">
          Notes
        </h2>

        {/* Save Status */}
        <motion.div
          key={saving ? "saving" : "saved"}
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs flex items-center gap-1"
        >
          {saving ? (
            <>
              <Loader2 size={12} className="animate-spin text-gray-400" />
              <span className="text-gray-400">Saving…</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={12} className="text-green-400" />
              <span className="text-green-400">Saved</span>
            </>
          )}
        </motion.div>
      </div>

      {/* Editor Container */}
      <div
        className="
          flex-1 p-4 rounded-2xl border border-[#2a2d33]
          bg-[#0e1116]/80 backdrop-blur-xl
          shadow-[0_0_25px_rgba(0,0,0,0.35)]
          transition-all
        "
      >
        <textarea
          value={note}
          onChange={handleChange}
          placeholder="Write anything you want: reminders, todos, architecture plans, bugs to fix…"
          className="
            w-full h-[40vh]
            bg-transparent outline-none resize-none
            text-sm text-gray-200 leading-relaxed tracking-wide
            scrollbar-thin scrollbar-thumb-[#3a3f45] scrollbar-track-transparent
          "
        />
      </div>
    </div>
  );
}

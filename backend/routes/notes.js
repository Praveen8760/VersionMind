
import express from "express";
import RepoNote from "../models/RepoNote.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

/* =======================================================
   GET NOTES FOR A REPO
======================================================= */
router.get("/:repoId", isAuthenticated, async (req, res) => {
  try {
    const { repoId } = req.params;
    const userId = req.user._id;

    const note = await RepoNote.findOne({ user: userId, repo: repoId });

    res.json({ note: note?.note || "" });
  } catch (err) {
    console.error("❌ Notes load error:", err);
    res.status(500).json({ error: "Failed to load notes" });
  }
});

/* =======================================================
   SAVE NOTES (Auto-save)
======================================================= */
router.post("/save", isAuthenticated, async (req, res) => {
  try {
    const { repoId, note } = req.body;
    const userId = req.user._id;

    const saved = await RepoNote.findOneAndUpdate(
      { user: userId, repo: repoId },
      { note },
      { upsert: true, new: true }
    );

    res.json({ success: true, note: saved.note });
  } catch (err) {
    console.error("❌ Notes save error:", err);
    res.status(500).json({ error: "Failed to save notes" });
  }
});

export default router;

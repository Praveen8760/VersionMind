
// backend/routes/chatHistory.js

import express from "express";
import ChatMessage from "../models/ChatMessage.js";

const router = express.Router();

/* ============================================================
   GET CHAT HISTORY
   final path:  GET /api/chat/history/:repoId
============================================================ */
router.get("/history/:repoId", async (req, res) => {
  try {
    const userId = req.user?._id;
    const { repoId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const messages = await ChatMessage.find({
      user: userId,
      repo: repoId,
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ messages });
  } catch (err) {
    console.error("Chat history fetch error:", err);
    return res.status(500).json({ error: "Failed to load chat history" });
  }
});

/* ============================================================
   SAVE MESSAGE
   final path: POST /api/chat/history/save
============================================================ */
router.post("/history/save", async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { repoId, sender, text, tokens, contextUsed } = req.body;

    const saved = await ChatMessage.create({
      user: userId,
      repo: repoId,
      sender,
      message: text,
      tokens,
      contextUsed,
    });

    return res.json({ success: true, message: saved });
  } catch (err) {
    console.error("Chat save error:", err);
    return res.status(500).json({ error: "Failed to save chat" });
  }
});

export default router;

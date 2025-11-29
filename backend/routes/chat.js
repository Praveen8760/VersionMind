
// backend/routes/chat.js

import express from "express";
import Repo from "../models/Repo.js";
import ChatMessage from "../models/ChatMessage.js";
import { runRAG } from "../services/rag.js";

const router = express.Router();

/* ========================================================================== */
/* LOGGING                                                                   */
/* ========================================================================== */

const LOG = {
  info: (m) => console.log(`\x1b[36m[INFO] ${m}\x1b[0m`),
  success: (m) => console.log(`\x1b[32m[SUCCESS] ${m}\x1b[0m`),
  warn: (m) => console.log(`\x1b[33m[WARN] ${m}\x1b[0m`),
  error: (m) => console.log(`\x1b[31m[ERROR] ${m}\x1b[0m`),
  event: (m) => console.log(`\x1b[35m[EVENT] ${m}\x1b[0m`),
  debug: (m) => console.log(`\x1b[90m[DEBUG] ${m}\x1b[0m`)
};

/* ========================================================================== */
/* SSE INIT                                                                   */
/* ========================================================================== */

function initSSE(res) {
  LOG.event("🔵 SSE Connection OPEN");

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders?.();

  const ping = setInterval(() =>
    res.write(`event: ping\ndata: "alive"\n\n`)
  , 15000);

  res.on("close", () => {
    clearInterval(ping);
    LOG.event("🔴 SSE Connection CLOSED");
  });
}

function safeWrite(res, data) {
  try {
    res.write(data);
  } catch (err) {
    LOG.error("❌ SSE write failed — client disconnected");
  }
}

/* ========================================================================== */
/*  LOAD CHAT HISTORY (new event for UI)                                      */
/* ========================================================================== */

router.get("/history/:repoId", async (req, res) => {
  try {
    const { repoId } = req.params;
    const userId = req.user._id;

    const messages = await ChatMessage.find({ repo: repoId, user: userId })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ messages });
  } catch (err) {
    console.error("❌ Chat history fetch error:", err);
    return res.status(500).json({ error: "Failed to load chat history" });
  }
});

/* ========================================================================== */
/* MAIN SSE ROUTE                                                             */
/* ========================================================================== */

router.get("/ask/stream", async (req, res) => {
  const t0 = Date.now();
  LOG.info("📩 Incoming GET /chat/ask/stream");

  try {
    const { repoId, query } = req.query;
    const userId = req.user?._id;

    LOG.info(`➡ Repo: ${repoId}`);
    LOG.info(`➡ Query: "${query}"`);

    if (!repoId || !query) {
      LOG.warn("⚠ Missing repoId or query");
      return safeWrite(res, `event: error\ndata: "Missing repoId/query"\n\n`);
    }

    if (!userId) {
      LOG.warn("⚠ User not logged in");
      return safeWrite(res, `event: error\ndata: "User not authenticated"\n\n`);
    }

    const repo = await Repo.findById(repoId);
    if (!repo) {
      LOG.error("❌ Repo not found");
      return safeWrite(res, `event: error\ndata: "Repo not found"\n\n`);
    }

    if (repo.status !== "ready") {
      LOG.warn(`⚠ Repo not ready: ${repo.status}`);
      return safeWrite(res, `event: error\ndata: "Repo not ready"\n\n`);
    }

    LOG.success(`📁 Repo Loaded: ${repo.repoName}`);

    /* ====================================================================== */
    /*  SAVE USER MESSAGE                                                     */
    /* ====================================================================== */

    await ChatMessage.create({
      user: userId,
      repo: repoId,
      sender: "user",
      message: query
    });

    /* ====================================================================== */
    /*  SSE OPEN                                                              */
    /* ====================================================================== */

    initSSE(res);

    // tell UI that streaming begins
    safeWrite(res, `event: start\ndata: "Streaming started"\n\n`);

    let aiFullResponse = "";
    let contextUsed = [];

    const sendToken = (token) =>
    {
      if (!token) return;
      aiFullResponse += token;
      safeWrite(res, `event: token\ndata: ${JSON.stringify({ token })}\n\n`);
    };

    LOG.info("🚀 Running RAG pipeline...");

    const ragResult = await runRAG({
      repoId,
      query,
      sendToken
    });

    contextUsed = ragResult?.contextUsed || [];

    LOG.success("🏁 RAG Completed");

    safeWrite(res, `event: done\ndata: "completed"\n\n`);
    LOG.info(`⏳ Time: ${Date.now() - t0}ms`);

    /* ====================================================================== */
    /*  SAVE AI RESPONSE                                                      */
    /* ====================================================================== */

    await ChatMessage.create({
      user: userId,
      repo: repoId,
      sender: "ai",
      message: aiFullResponse,
      tokens: aiFullResponse.length,
      contextUsed
    });

    return res.end();
  }
  catch (err) {
    LOG.error("❌ Stream Error: " + err.message);
    safeWrite(res,
      `event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`
    );

    try { res.end(); } catch {}
  }
});

/* ========================================================================== */
/* LEGACY ROUTE (unchanged)                                                   */
/* ========================================================================== */

router.post("/ask", (req, res) =>
  res.json({
    error: "❌ Use GET /api/chat/ask/stream instead. POST is deprecated."
  })
);

export default router;

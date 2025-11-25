
// backend/routes/chat.js
import express from "express";
import Repo from "../models/Repo.js";
import { runRAG } from "../services/rag.js";

const router = express.Router();

/* ============================================================================
   LOGGING (Colored Console Output)
============================================================================= */
const LOG = {
  info: (m) => console.log(`\x1b[36m[INFO] ${m}\x1b[0m`),
  success: (m) => console.log(`\x1b[32m[SUCCESS] ${m}\x1b[0m`),
  warn: (m) => console.log(`\x1b[33m[WARN] ${m}\x1b[0m`),
  error: (m) => console.log(`\x1b[31m[ERROR] ${m}\x1b[0m`),
  event: (m) => console.log(`\x1b[35m[EVENT] ${m}\x1b[0m`),
  debug: (m) => console.log(`\x1b[90m[DEBUG] ${m}\x1b[0m`)
};

/* ============================================================================
   Initialize SSE channel
============================================================================= */
function initSSE(res) {
  LOG.event("🔵 SSE Connection OPEN");

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders?.();

  // Keep-alive heartbeat (prevents disconnections)
  const ping = setInterval(() => {
    res.write(`event: ping\ndata: "alive"\n\n`);
  }, 15000);

  res.on("close", () => {
    clearInterval(ping);
    LOG.event("🔴 SSE Connection CLOSED");
  });
}

/* ============================================================================
   Safe SSE write (avoids crashes if client disconnects)
============================================================================= */
function safeWrite(res, data) {
  try {
    res.write(data);
  } catch (err) {
    LOG.error("❌ SSE write failed, client disconnected");
  }
}

/* ============================================================================
   MAIN SSE ROUTE: GET /chat/ask/stream
   (works with EventSource)
============================================================================= */
router.get("/ask/stream", async (req, res) => {
  const t0 = Date.now();
  LOG.info("📩 Incoming GET /chat/ask/stream");

  try {
    const { repoId, query } = req.query;

    LOG.debug("Query Params: " + JSON.stringify(req.query));
    LOG.info(`➡ Repo: ${repoId}`);
    LOG.info(`➡ Query: "${query}"`);

    // --------------------- VALIDATION ---------------------
    if (!repoId || !query) {
      LOG.warn("⚠ Missing repoId or query");
      return safeWrite(res, `event: error\ndata: "Missing repoId/query"\n\n`);
    }

    const repo = await Repo.findById(repoId);
    if (!repo) {
      LOG.error("❌ Repo not found");
      return safeWrite(res, `event: error\ndata: "Repo not found"\n\n`);
    }

    if (repo.status !== "ready") {
      LOG.warn(`⚠ Repo not ready: ${repo.status}`);
      return safeWrite(
        res,
        `event: error\ndata: "Repo not ready: ${repo.status}"\n\n`
      );
    }

    LOG.success(`📁 Repo Loaded: ${repo.repoName}`);

    // --------------------- OPEN SSE ---------------------
    initSSE(res);

    safeWrite(res, `event: start\ndata: "Streaming started"\n\n`);

    const sendToken = (token) => {
      if (!token) return;
      LOG.event("⬆ TOKEN: " + token.replace(/\n/g, "\\n"));
      safeWrite(res, `event: token\ndata: ${JSON.stringify({ token })}\n\n`);
    };

    LOG.info("🚀 Running RAG pipeline...");

    // --------------------- RUN RAG ---------------------
    await runRAG({
      repoId,
      query,
      sendToken
    });

    LOG.success("🏁 RAG Completed");

    safeWrite(res, `event: done\ndata: "completed"\n\n`);
    LOG.info(`⏳ Time: ${Date.now() - t0}ms`);

    return res.end();
  } catch (err) {
    LOG.error("❌ Stream Route Error: " + err.message);

    safeWrite(
      res,
      `event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`
    );

    try { res.end(); } catch {}
  }
});

/* ============================================================================
   Legacy POST /ask route (optional — kept for compatibility)
============================================================================= */
router.post("/ask", (req, res) => {
  res.json({
    error:
      "❌ Use GET /api/chat/ask/stream instead. The POST route is deprecated."
  });
});

export default router;

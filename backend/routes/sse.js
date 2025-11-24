
// backend/routes/sse.js

import express from "express";
const router = express.Router();

// Store SSE clients by repoId
global.sseClients = global.sseClients || {};

/* -------------------------------------------------------
   SAFE GLOBAL PROGRESS PUSHER
------------------------------------------------------- */
global.sendProgress = (repoId, data) => {
  const client = global.sseClients[repoId];

  if (!client) return;               // No SSE connection
  if (client.finished) return;       // Response ended
  if (client.destroyed) return;      // Socket closed

  try {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (err) {
    console.error("❌ SSE write failed for", repoId, err.message);
  }
};

/* -------------------------------------------------------
   SSE ENDPOINT
------------------------------------------------------- */
router.get("/repo-progress/:repoId", (req, res) => {
  const repoId = req.params.repoId;

  // ---- Required SSE headers ----
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");   // Disable buffering (Nginx)
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Tell client: do not retry instantly
  res.write("retry: 3000\n\n");

  console.log("🔵 SSE connected:", repoId);

  global.sseClients[repoId] = res;

  // ---- Send heartbeat ----
  const heartbeat = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      // Client is probably disconnected
    }
  }, 15000);

  // ---- Handle disconnect ----
  req.on("close", () => {
    console.log("🔴 SSE closed:", repoId);

    clearInterval(heartbeat);

    // Cleanup safely
    if (global.sseClients[repoId]) delete global.sseClients[repoId];

    try {
      res.end();
    } catch {}
  });
});

export default router;

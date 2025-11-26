

// backend/routes/sse.js

import express from "express";
const router = express.Router();

// Store connected clients (one per repo import process)
global.sseClients = global.sseClients || {};

/* ============================================================================
   SAFE GLOBAL PROGRESS EMITTER
============================================================================ */
global.sendProgress = (repoId, data = {}) => {
  const client = global.sseClients[repoId];

  // No active SSE connection
  if (!client) return;

  // Avoid writing to closed stream
  if (client.finished || client.destroyed) return;

  try {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (err) {
    console.error(`❌ SSE write failed for repo ${repoId}:`, err.message);
  }
};

/* ============================================================================
   SSE ENDPOINT
============================================================================ */
router.get("/repo-progress/:repoId", (req, res) => {
  const { repoId } = req.params;

  console.log("🔵 [SSE] Client connected for repo:", repoId);

  /* -------------------------------------------------------
     REQUIRED SSE HEADERS
  ------------------------------------------------------- */
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  // Allow frontend
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Disable Nginx buffering (critical!)
  res.setHeader("X-Accel-Buffering", "no");

  // Tell EventSource to wait 3 seconds before reconnect attempts
  res.write("retry: 3000\n\n");

  /* -------------------------------------------------------
     Register this client under repoId
  ------------------------------------------------------- */
  global.sseClients[repoId] = res;

  /* -------------------------------------------------------
     Send periodic heartbeats
  ------------------------------------------------------- */
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      console.log("⚠ SSE heartbeat failed for:", repoId);
    }
  }, 15000);

  /* -------------------------------------------------------
     Cleanup when the client disconnects
  ------------------------------------------------------- */
  req.on("close", () => {
    console.log("🔴 [SSE] Connection closed for repo:", repoId);

    clearInterval(heartbeat);

    // Close & cleanup client map
    if (global.sseClients[repoId]) {
      delete global.sseClients[repoId];
    }

    try {
      res.end();
    } catch {
      // Already closed
    }
  });
});

export default router;

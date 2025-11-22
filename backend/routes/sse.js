
import express from "express";
export const router = express.Router();

global.sseClients = global.sseClients || {};

router.get("/repo-progress/:repoId", (req, res) => {

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // REQUIRED for frontend cookies to send:
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  res.flushHeaders();

  const repoId = req.params.repoId;

  console.log("🔵 SSE connected:", repoId);

  global.sseClients[repoId] = res;

  req.on("close", () => {
    console.log("🔴 SSE closed:", repoId);
    delete global.sseClients[repoId];
  });
});

export default router;

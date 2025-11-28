

// backend/routes/ai.js

import express from "express";
import { generateSummary } from "../services/ai/summaryService.js";
import { generateMetrics } from "../services/ai/metricsService.js";
import { generateDependencyInsights } from "../services/ai/dependencyService.js";
import { generateHotspots } from "../services/ai/hotspotService.js";

const router = express.Router();

// 1) Summary
router.get("/summary/:repoId", async (req, res) => {
  try {
    const repoId = req.params.repoId;
    const summary = await generateSummary(repoId);
    res.json({ summary });
  } catch (err) {
    console.error("[AI SUMMARY ERROR]", err);
    res.status(500).json({ summary: "Failed to generate summary" });
  }
});

// 2) Code metrics
router.get("/metrics/:repoId", async (req, res) => {
  try {
    const metrics = await generateMetrics(req.params.repoId);
    res.json(metrics);
  } catch (err) {
    console.error("[AI METRICS ERROR]", err);
    res.status(500).json({ error: "Failed to generate metrics" });
  }
});

// 3) Dependency Insights
router.get("/deps/:repoId", async (req, res) => {
  try {
    const insights = await generateDependencyInsights(req.params.repoId);
    res.json(insights);
  } catch (err) {
    console.error("[AI DEPS ERROR]", err);
    res.status(500).json({ error: "Dependency insights failed" });
  }
});

// 4) Hotspots
router.get("/hotspots/:repoId", async (req, res) => {
  try {
    const hot = await generateHotspots(req.params.repoId);
    res.json(hot);
  } catch (err) {
    console.error("[AI HOTSPOTS ERROR]", err);
    res.status(500).json({ error: "Failed to analyze hotspots" });
  }
});

// export route


router.get("/export/:repoId", async (req, res) => {
  try {
    const { repoId } = req.params;
    const { format } = req.query;

    const file = await exportInsights(repoId, format || "json");

    res.setHeader("Content-Disposition", `attachment; filename=${file.name}`);
    res.setHeader("Content-Type", file.mime);

    res.send(file.data);
  } catch (err) {
    console.error("[EXPORT ERROR]", err);
    res.status(500).json({ error: "Export failed" });
  }
});

export default router;

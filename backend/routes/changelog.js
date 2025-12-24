

import express from "express";
import { generateChangelog } from "../services/ai/changelogService.js";

const router = express.Router();

router.get("/:repoId", async (req, res) => {
  try {
    const { repoId } = req.params;

    const { commits, changelog } = await generateChangelog(repoId);

    return res.json({ commits, changelog });
  } catch (err) {
    console.error("CHANGELOG ERROR:", err);
    return res.status(500).json({ error: "Failed to generate changelog" });
  }
});

export default router;


// backend/controllers/repoController.js

import Repo from "../models/Repo.js";
import User from "../models/User.js";
import { importRepository } from "../services/repoImport.js";


// =====================================================
// POST /api/repo/import
// =====================================================
export async function importRepo(req, res) {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl || !repoUrl.startsWith("https://github.com/")) {
      return res.status(400).json({
        success: false,
        message: "Invalid GitHub repository URL",
      });
    }

    // Logged-in user
    const user = await User.findById(req.user._id);
    if (!user || !user.accessToken) {
      return res.status(401).json({
        success: false,
        message: "GitHub access token missing. Log in again.",
      });
    }

    // Import repository using service
    const result = await importRepository({
      githubToken: user.accessToken,
      repoUrl,
      userId: user._id,
    });

    return res.json(result);

  } catch (err) {
    console.error("Import Repo Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}


// =====================================================
// GET /api/repo/list
// =====================================================
export async function listRepos(req, res) {
  try {
    const repos = await Repo.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, repos });

  } catch (err) {
    console.error("List Repo Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}


// =====================================================
// GET /api/repo/status/:repoId
// =====================================================
export async function getRepoStatus(req, res) {
  try {
    const { repoId } = req.params;

    const repo = await Repo.findOne({
      _id: repoId,
      userId: req.user._id,
    });

    if (!repo) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    return res.json({
      success: true,
      status: repo.status,
      fileCount: repo.fileCount,
      indexedFiles: repo.indexedFiles,
    });

  } catch (err) {
    console.error("Repo Status Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

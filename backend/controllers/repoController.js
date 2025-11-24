
// backend/controllers/repoController.js

import Repo from "../models/Repo.js";
import User from "../models/User.js";
import { importRepository } from "../services/repoImport.js";

/* -----------------------------------------------------
   Utility: Extract owner/repo from GitHub URL
----------------------------------------------------- */
function parseRepoUrl(repoUrl) {
  if (!repoUrl) return null;
  const clean = repoUrl.trim().replace(/\.git$/, "");

  const match = clean.match(/github\.com\/([^/]+)\/([^/]+)$/);
  if (!match) return null;

  return { owner: match[1], repo: match[2] };
}

/* =====================================================
   POST /api/repo/import
   (Duplicate-safe, atomic, SSE-supported)
===================================================== */
export async function importRepo(req, res) {
  try {
    const { repoUrl } = req.body;

    // Validate URL
    if (!repoUrl || !repoUrl.startsWith("https://github.com/")) {
      return res.status(400).json({
        success: false,
        message: "Invalid GitHub repository URL",
      });
    }

    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      return res.status(400).json({
        success: false,
        message: "Invalid GitHub repository URL format",
      });
    }

    const { owner, repo } = parsed;
    const fullName = `${owner}/${repo}`;

    // Check user session
    const user = await User.findById(req.user._id);
    if (!user || !user.accessToken) {
      return res.status(401).json({
        success: false,
        message: "GitHub access token missing. Log in again.",
      });
    }

    /* -----------------------------------------------------
       DUPLICATE CHECK
       If repo already fully imported → STOP
    ----------------------------------------------------- */
    const existing = await Repo.findOne({
      user: user._id,
      repoName: fullName,
      status: "ready",
    });

    if (existing) {
      return res.json({
        success: false,
        alreadyImported: true,
        repoId: existing._id,
        message: `Repository "${fullName}" is already imported.`,
      });
    }

    /* -----------------------------------------------------
       CREATE TEMP PENDING REPO
       (Used by importRepository to fill metadata)
    ----------------------------------------------------- */
    const tempRepo = await Repo.create({
      user: user._id,
      repoName: "Preparing import...",
      status: "pending",
      fileCount: 0,
      indexedFiles: 0,
    });

    const repoId = tempRepo._id.toString();

    // Tell frontend immediately → allow SSE connect
    res.json({ success: true, repoId });

    /* -----------------------------------------------------
       Run import in background
    ----------------------------------------------------- */
    importRepository({
      githubToken: user.accessToken,
      repoUrl,
      userId: user._id,
      sendProgress: (data) => global.sendProgress(repoId, data),
    })
      .then(async (result) => {
        // Update final status
        await Repo.findByIdAndUpdate(repoId, {
          status: result.success ? "ready" : "error",
          repoName: result.success ? fullName : "Import failed",
        });

        global.sendProgress(repoId, {
          type: "DONE",
          progress: 100,
        });
      })
      .catch(async (err) => {
        console.error("Async Import Error:", err);

        await Repo.findByIdAndUpdate(repoId, {
          status: "error",
          repoName: "Import failed",
        });

        global.sendProgress(repoId, {
          type: "ERROR",
          message: "Import failed",
          progress: 0,
        });
      });

  } catch (err) {
    console.error("Import Repo Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

/* =====================================================
   GET /api/repo/list
===================================================== */
export async function listRepos(req, res) {
  try {
    const repos = await Repo.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, repos });

  } catch (err) {
    console.error("List Repo Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* =====================================================
   GET /api/repo/status/:repoId
===================================================== */
export async function getRepoStatus(req, res) {
  try {
    const { repoId } = req.params;

    const repo = await Repo.findOne({
      _id: repoId,
      user: req.user._id,
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
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

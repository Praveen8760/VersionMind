
// backend/services/repoImport.js

import axios from "axios";
import crypto from "crypto";

import Repo from "../models/Repo.js";
import File from "../models/File.js";
import Embedding from "../models/Embedding.js";

import {
  generateEmbedding,
  countTokens,
  chunkText
} from "./ragUtils.js";

// -----------------------------------------------
// Utility: SHA256 Hash
// -----------------------------------------------
function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

// -----------------------------------------------
// FIXED: Parse GitHub URL properly
// -----------------------------------------------
function parseRepoUrl(repoUrl) {
  if (!repoUrl) throw new Error("Repository URL is required");

  // Remove trailing ".git"
  repoUrl = repoUrl.trim().replace(/\.git$/, "");

  // Extract owner + repo
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)$/);

  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }

  return {
    owner: match[1],
    repo: match[2]
  };
}

// =======================================================
// MAIN: Import Repository
// =======================================================
export async function importRepository({ githubToken, repoUrl, userId }) {
  try {
    // -----------------------------------------------
    // Step 1: Parse Repository URL
    // -----------------------------------------------
    const { owner, repo } = parseRepoUrl(repoUrl);

    // -----------------------------------------------
    // Step 2: Get Repository Metadata
    // -----------------------------------------------
    let repoMeta;
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers: { Authorization: `Bearer ${githubToken}` } }
      );
      repoMeta = res.data;
    } catch (err) {
      throw new Error("GitHub returned 404 — Repository not found");
    }

    // -----------------------------------------------
    // Step 3: Create or reuse Repo Document
    // -----------------------------------------------
    let repoDoc = await Repo.findOne({
      userId,
      repoId: repoMeta.id
    });

    if (!repoDoc) {
      repoDoc = await Repo.create({
        userId,
        repoId: repoMeta.id,
        repoName: `${owner}/${repo}`,
        branch: repoMeta.default_branch,
        status: "importing",
        fileCount: 0,
        indexedFiles: 0,
        sha: repoMeta.sha,
        sizeInKB: repoMeta.size
      });
    } else {
      if (repoDoc.status === "ready") {
        return {
          success: true,
          message: "Repository already imported",
          repoId: repoDoc._id
        };
      }
      repoDoc.status = "importing";
      await repoDoc.save();
    }

    const branch = repoDoc.branch;

    // -----------------------------------------------
    // Step 4: Fetch Repository Tree
    // -----------------------------------------------
    let tree;
    try {
      const treeRes = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers: { Authorization: `Bearer ${githubToken}` } }
      );
      tree = treeRes.data.tree;
    } catch (err) {
      throw new Error("Failed to fetch repository tree");
    }

    if (!Array.isArray(tree)) {
      throw new Error("GitHub did not return a valid repository tree");
    }

    // Filter out non-code files + garbage
    const codeFiles = tree.filter(
      f =>
        f.type === "blob" &&
        !/\.(png|jpg|jpeg|gif|svg|mp4|zip|exe|dll|pdf)$/i.test(f.path) &&
        !f.path.startsWith("node_modules") &&
        !f.path.includes("dist") &&
        !f.path.includes("build")
    );

    repoDoc.fileCount = codeFiles.length;
    await repoDoc.save();

    // -----------------------------------------------
    // Step 5: Process Each File
    // -----------------------------------------------
    for (let i = 0; i < codeFiles.length; i++) {
      const file = codeFiles[i];

      // Fetch raw content from GitHub
      let content;
      try {
        const raw = await axios.get(
          `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`,
          { headers: { Authorization: `Bearer ${githubToken}` } }
        );
        content = raw.data;
      } catch (err) {
        console.warn("⚠ Failed to fetch:", file.path);
        continue;
      }

      const contentHash = sha256(content);

      // Find existing file
      let fileDoc = await File.findOne({
        repoId: repoDoc._id,
        filePath: file.path
      });

      // Skip unchanged
      if (fileDoc && fileDoc.hash === contentHash) {
        console.log("Skipping unchanged:", file.path);
        continue;
      }

      // Create or update file
      if (!fileDoc) {
        fileDoc = await File.create({
          repoId: repoDoc._id,
          filePath: file.path,
          extension: file.path.split(".").pop(),
          content,
          hash: contentHash,
          tokens: countTokens(content)
        });
      } else {
        fileDoc.content = content;
        fileDoc.hash = contentHash;
        fileDoc.tokens = countTokens(content);
        await fileDoc.save();
      }

      // Delete old embeddings
      await Embedding.deleteMany({ fileId: fileDoc._id });

      // Chunk + Embedding
      const chunks = chunkText(content);

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const chunkHash = sha256(chunk);

        const embedding = await generateEmbedding(chunk);

        await Embedding.create({
          repoId: repoDoc._id,
          fileId: fileDoc._id,
          chunkIndex,
          content: chunk,
          embedding,
          hash: chunkHash
        });
      }

      // Update progress
      repoDoc.indexedFiles = i + 1;
      await repoDoc.save();
    }

    // -----------------------------------------------
    // Step 6: Finish Import
    // -----------------------------------------------
    repoDoc.status = "ready";
    await repoDoc.save();

    return {
      success: true,
      message: "Repository imported successfully",
      repoId: repoDoc._id
    };

  } catch (err) {
    console.error("❌ Repo Import Error:", err.message);
    return { success: false, message: err.message };
  }
}

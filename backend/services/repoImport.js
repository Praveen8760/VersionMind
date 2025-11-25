

// backend/services/repoImport.js

import axios from "axios";
import crypto from "crypto";

import Repo from "../models/Repo.js";
import File from "../models/File.js";
import Embedding from "../models/Embedding.js";

import {
  generateEmbedding,   // now dual model aware
  chunkText,
  countTokens,
  isCode
} from "./ragUtils.js";

/* -----------------------------------------------------------
   SHA256 Utility
----------------------------------------------------------- */
function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

/* -----------------------------------------------------------
   Parse GitHub Repo URL
----------------------------------------------------------- */
function parseRepoUrl(repoUrl) {
  if (!repoUrl) throw new Error("Repository URL required");

  const clean = repoUrl.trim().replace(/\.git$/, "");
  const match = clean.match(/github\.com\/([^/]+)\/([^/]+)$/);

  if (!match) throw new Error("Invalid GitHub URL format");
  return { owner: match[1], repo: match[2] };
}

/* -----------------------------------------------------------
   Binary Detection
----------------------------------------------------------- */
function isBinaryContent(content) {
  if (!content) return true;
  if (typeof content !== "string") return false;
  if (content.includes("\u0000")) return true;
  return false;
}

/* -----------------------------------------------------------
   File Filters
----------------------------------------------------------- */
const BINARY_EXT_REGEX =
  /\.(png|jpe?g|gif|svg|mp4|mp3|wav|zip|gz|exe|dll|pdf|mov|avi|ttf|otf)$/i;

/* ===================================================================
   MAIN IMPORT PIPELINE
=================================================================== */
export async function importRepository({
  githubToken,
  repoUrl,
  userId,
  sendProgress,
}) {
  let repoDoc = null;
  let repoId = null;

  try {
    /* ------------------------------------------
       STEP 1 → Parse Repo
    ------------------------------------------ */
    const { owner, repo } = parseRepoUrl(repoUrl);

    /* ------------------------------------------
       STEP 2 → Metadata
    ------------------------------------------ */
    const meta = await axios
      .get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { Authorization: `Bearer ${githubToken}` },
      })
      .catch(() => {
        throw new Error("GitHub repo not found or access denied.");
      });

    const repoMeta = meta.data;
    const branch = repoMeta.default_branch;

    let existing = await Repo.findOne({
      user: userId,
      repoId: repoMeta.id,
      status: "ready",
    });

    if (existing) {
      return {
        success: false,
        alreadyImported: true,
        repoId: existing._id,
      };
    }

    /* ------------------------------------------
       STEP 3 → Locate pending temporary repo
    ------------------------------------------ */
    repoDoc = await Repo.findOne({
      user: userId,
      status: "pending",
    }).sort({ createdAt: -1 });

    if (!repoDoc) throw new Error("Temporary repo entry missing");

    repoDoc.repoId = repoMeta.id;
    repoDoc.repoName = `${owner}/${repo}`;
    repoDoc.branch = branch;
    repoDoc.status = "importing";
    await repoDoc.save();

    repoId = repoDoc._id.toString();

    /* ------------------------------------------
       STEP 4 → Fetch Repo Tree
    ------------------------------------------ */
    const tree = await axios
      .get(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers: { Authorization: `Bearer ${githubToken}` } }
      )
      .then((r) => r.data.tree);

    const codeFiles = tree.filter((f) => {
      if (f.type !== "blob") return false;
      if (f.path.startsWith(".")) return false;
      if (f.path.includes("node_modules")) return false;
      if (f.path.includes("dist") || f.path.includes("build")) return false;
      if (BINARY_EXT_REGEX.test(f.path)) return false;
      return true;
    });

    repoDoc.fileCount = codeFiles.length;
    repoDoc.indexedFiles = 0;
    await repoDoc.save();

    /* ===================================================================
       STEP 5 → Process Files
    ==================================================================== */
    for (let i = 0; i < codeFiles.length; i++) {
      const filePath = codeFiles[i].path;
      const fileIndex = i + 1;

      sendProgress(repoId, {
        type: "FILE_START",
        file: filePath,
        index: fileIndex,
        totalFiles: codeFiles.length,
        percent: Math.round((i / codeFiles.length) * 100),
      });

      /* Fetch raw text */
      const raw = await axios
        .get(
          `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github.v3.raw",
            },
            responseType: "text",
            transformResponse: (d) => d,
          }
        )
        .then((r) => r.data)
        .catch(() => null);

      if (!raw || isBinaryContent(raw)) {
        console.log("⏭️ Skipping binary:", filePath);
        continue;
      }

      const hash = sha256(raw);

      let fileDoc = await File.findOne({ repoId: repoDoc._id, filePath });

      let changed = false;
      if (!fileDoc) {
        fileDoc = await File.create({
          repoId: repoDoc._id,
          filePath,
          extension: filePath.split(".").pop() || "",
          content: raw,
          hash,
          tokens: countTokens(raw),
        });
        changed = true;
      } else if (fileDoc.hash !== hash) {
        fileDoc.content = raw;
        fileDoc.hash = hash;
        fileDoc.tokens = countTokens(raw);
        await fileDoc.save();
        changed = true;
      }

      /* Recompute chunks only if file changed */
      if (changed) {
        await Embedding.deleteMany({ fileId: fileDoc._id });

        const chunks = chunkText(raw);

        for (let ci = 0; ci < chunks.length; ci++) {
          const chunk = chunks[ci];
          if (!chunk.trim()) continue; // ignore empty chunks

          sendProgress(repoId, {
            type: "CHUNK_PROGRESS",
            file: filePath,
            chunkIndex: ci + 1,
            chunkTotal: chunks.length,
            overallPercent: Math.round(
              ((i + ci / chunks.length) / codeFiles.length) * 100
            ),
          });

          /* Dual embedding logic here */
          const embedding = await generateEmbedding(chunk);

          if (!embedding) {
            console.log("❌ Skipped chunk with failed embedding.");
            continue;
          }

          await Embedding.create({
            repoId: repoDoc._id,
            fileId: fileDoc._id,
            chunkIndex: ci,
            content: chunk,
            embedding,
            model: isCode(chunk) ? "mxbai-embed-large" : "nomic-embed-text",
            hash: sha256(chunk),
            tokenCount: countTokens(chunk),
          });
        }
      }

      repoDoc.indexedFiles = fileIndex;
      await repoDoc.save();

      sendProgress(repoId, {
        type: "FILE_DONE",
        file: filePath,
        overallPercent: Math.round((fileIndex / codeFiles.length) * 100),
      });
    }

    /* Finalize Repo */
    repoDoc.status = "ready";
    await repoDoc.save();

    sendProgress(repoId, { type: "DONE", progress: 100 });
    return { success: true, repoId };

  } catch (err) {
    console.error("❌ Repo Import Error:", err);

    if (repoDoc) {
      repoDoc.status = "error";
      await repoDoc.save();
    }

    if (repoId && sendProgress) {
      sendProgress(repoId, {
        type: "ERROR",
        message: err.message,
      });
    }

    return { success: false, message: err.message };
  }
}

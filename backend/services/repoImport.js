
// backend/services/repoImport.js

import axios from "axios";
import crypto from "crypto";

import Repo from "../models/Repo.js";
import File from "../models/File.js";
import Embedding from "../models/Embedding.js";

import {
  generateEmbedding,
  countTokens,
  chunkText,
} from "./ragUtils.js";

/* -----------------------------------------------------------
   SAFE SHA256
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
   FIXED BINARY DETECTION
----------------------------------------------------------- */
function isBinaryContent(content) {
  if (!content) return true;

  // If GitHub returns an object → it's parsed JSON → NOT binary
  if (typeof content !== "string") return false;

  // Null bytes → real binary
  if (content.includes("\u0000")) return true;

  return false; // keep everything else
}

/* -----------------------------------------------------------
   FILE EXTENSION HANDLING
----------------------------------------------------------- */

const TEXT_EXT = [
  "js","jsx","ts","tsx",
  "json","md","txt","html","css","scss",
  "yaml","yml","xml","env"
];

const BINARY_EXT_REGEX =
  /\.(png|jpe?g|gif|svg|mp4|zip|gz|exe|dll|pdf|mov|avi|mp3|wav|ttf|otf)$/i;


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
    /* STEP 1 — Parse */
    const { owner, repo } = parseRepoUrl(repoUrl);

    /* STEP 2 — Fetch metadata */
    const meta = await axios
      .get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { Authorization: `Bearer ${githubToken}` },
      })
      .catch(() => {
        throw new Error("GitHub repo not found or not accessible");
      });

    const repoMeta = meta.data;
    const branch = repoMeta.default_branch;

    /* Check duplicates */
    repoDoc = await Repo.findOne({
      user: userId,
      repoId: repoMeta.id,
      status: "ready",
    });

    if (repoDoc) {
      return {
        success: false,
        alreadyImported: true,
        repoId: repoDoc._id,
        message: "Repository already imported.",
      };
    }

    /* Pending repo created earlier */
    repoDoc = await Repo.findOne({
      user: userId,
      status: "pending",
    }).sort({ createdAt: -1 });

    if (!repoDoc) throw new Error("Temp repo not found");

    /* Fill metadata */
    repoDoc.repoId = repoMeta.id;
    repoDoc.repoName = `${owner}/${repo}`;
    repoDoc.branch = branch;
    repoDoc.status = "importing";
    repoDoc.indexedFiles = 0;
    await repoDoc.save();

    repoId = repoDoc._id.toString();

    /* STEP 3 — Fetch tree */
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

      const ext = f.path.split(".").pop()?.toLowerCase() || "";

      if (BINARY_EXT_REGEX.test(f.path)) return false;

      return true; // accept everything else as text
    });

    repoDoc.fileCount = codeFiles.length;
    await repoDoc.save();

    /* ===================================================================
       STEP 4 — Process files
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

      /* Fetch RAW text ALWAYS */
      const raw = await axios
        .get(
          `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github.v3.raw", // 🔥 force raw text
            },
            responseType: "text",
            transformResponse: (d) => d, // 🔥 prevent JSON auto-parse
          }
        )
        .then((r) => r.data)
        .catch(() => null);

      if (!raw || isBinaryContent(raw)) {
        console.log("⏭️ Skip binary:", filePath);
        continue;
      }

      const hash = sha256(raw);

      /* Create/update file doc */
      let fileDoc = await File.findOne({
        repoId: repoDoc._id,
        filePath,
      });

      let changed = false;

      if (!fileDoc) {
        fileDoc = await File.create({
          repoId: repoDoc._id,
          filePath,
          extension: filePath.split(".").pop(),
          content: raw,
          hash,
          tokens: countTokens(raw),
        });
        changed = true;
      } 
      else if (fileDoc.hash !== hash) {
        fileDoc.content = raw;
        fileDoc.hash = hash;
        fileDoc.tokens = countTokens(raw);
        await fileDoc.save();
        changed = true;
      }

      /* Embedding only when changed */
      if (changed) {
        await Embedding.deleteMany({ fileId: fileDoc._id });

        const chunks = chunkText(raw);

        for (let ci = 0; ci < chunks.length; ci++) {
          const chunk = chunks[ci];

          sendProgress(repoId, {
            type: "CHUNK_PROGRESS",
            file: filePath,
            chunkIndex: ci + 1,
            chunkTotal: chunks.length,
            overallPercent: Math.round(
              ((i + ci / chunks.length) / codeFiles.length) * 100
            ),
          });

          const emb = await generateEmbedding(chunk);

          await Embedding.create({
            repoId: repoDoc._id,
            fileId: fileDoc._id,
            chunkIndex: ci,
            content: chunk,
            embedding: emb,
            hash: sha256(chunk),
          });
        }
      }

      repoDoc.indexedFiles = fileIndex;
      await repoDoc.save();

      sendProgress(repoId, {
        type: "FILE_DONE",
        file: filePath,
        filePercent: 100,
        overallPercent: Math.round((fileIndex / codeFiles.length) * 100),
      });
    }

    repoDoc.status = "ready";
    await repoDoc.save();

    sendProgress(repoId, { type: "DONE", progress: 100 });

    return { success: true, repoId };
  } 
  catch (err) {
    console.error("❌ Repo Import Error:", err);

    if (sendProgress && repoId) {
      sendProgress(repoId, { type: "ERROR", message: err.message });
    }

    if (repoDoc) {
      repoDoc.status = "error";
      await repoDoc.save();
    }

    return { success: false, message: err.message };
  }
}

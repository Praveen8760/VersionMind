
// backend/services/repoImport.js

import axios from "axios";
import crypto from "crypto";

import Repo from "../models/Repo.js";
import File from "../models/File.js";
import Embedding from "../models/Embedding.js";
import FunctionNode from "../models/FunctionNode.js";

import {
  generateEmbedding,
  chunkText,
  countTokens,
  isCode,
} from "./ragUtils.js";

/* ============================================================================
   UTILS
============================================================================ */
const sha256 = (v) =>
  crypto.createHash("sha256").update(String(v)).digest("hex");

function parseRepoUrl(repoUrl) {
  if (!repoUrl) throw new Error("Repository URL required");

  const clean = repoUrl.trim().replace(/\.git$/, "");
  const m = clean.match(/github\.com\/([^/]+)\/([^/]+)$/);

  if (!m) throw new Error("Invalid GitHub repository URL format");
  return { owner: m[1], repo: m[2] };
}

function isBinaryContent(content) {
  if (!content) return true;
  if (typeof content !== "string") return false;
  if (content.includes("\u0000")) return true;
  return false;
}

const BINARY_EXT_REGEX =
  /\.(png|jpe?g|gif|svg|mp3|wav|mp4|mov|avi|zip|gz|pdf|exe|ttf|otf)$/i;

/* ============================================================================
   FUNCTION PARSING
============================================================================ */
function extractFunctions(code, fileId, repoId) {
  const lines = code.split("\n");
  const nodes = [];

  const patterns = [
    { regex: /^function\s+(\w+)\s*\(/, type: "function" },
    { regex: /^const\s+(\w+)\s*=\s*\(/, type: "function" },
    { regex: /^class\s+(\w+)/, type: "class" },
    { regex: /^def\s+(\w+)\s*\(/, type: "function" },
    { regex: /^(\w+)\s*\((.*?)\)\s*{/, type: "method" },
  ];

  lines.forEach((line, i) => {
    for (const { regex, type } of patterns) {
      const match = line.trim().match(regex);
      if (match) {
        nodes.push({
          repoId,
          fileId,
          name: match[1],
          type,
          startLine: i + 1,
          endLine: i + 1,
          calls: [],
          calledBy: [],
        });
      }
    }
  });

  return nodes;
}

function detectCalls(codeLines, nodes) {
  const callRegex = /(\w+)\s*\(/g;

  nodes.forEach((node) => {
    const calls = new Set();

    codeLines.forEach((line) => {
      let m;
      while ((m = callRegex.exec(line)) !== null) {
        const fn = m[1];
        if (fn !== node.name) calls.add(fn);
      }
    });

    node.calls = [...calls];
  });

  return nodes;
}

/* ============================================================================
   MAIN IMPORT PIPELINE
============================================================================ */
export async function importRepository({
  githubToken,
  repoUrl,
  userId,
  sendProgress,
}) {
  let repoDoc = null;
  let repoId = null;

  try {
    /* ---------------------------------------------
       STEP 1 — Parse URL
    --------------------------------------------- */
    const { owner, repo } = parseRepoUrl(repoUrl);

    /* ---------------------------------------------
       STEP 2 — GitHub Metadata
    --------------------------------------------- */
    const meta = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers: { Authorization: `Bearer ${githubToken}` } }
    );

    const repoMeta = meta.data;
    const branch = repoMeta.default_branch;

    /* ---------------------------------------------
       STEP 3 — DUPLICATE CHECK
       NOTE: githubId replaces "repoId"
    --------------------------------------------- */
    const existing = await Repo.findOne({
      user: userId,
      githubId: repoMeta.id,
      status: "ready",
    });

    if (existing) {
      return {
        success: false,
        alreadyImported: true,
        repoId: existing._id,
      };
    }

    /* ---------------------------------------------
       STEP 4 — Pending Repo Entry
    --------------------------------------------- */
    repoDoc = await Repo.findOne({
      user: userId,
      status: "pending",
    }).sort({ createdAt: -1 });

    if (!repoDoc) throw new Error("Temporary repository not found");

    // 🟦 FIX: store GitHub ID correctly
    repoDoc.githubId = repoMeta.id;      // << FIXED
    repoDoc.repoName = `${owner}/${repo}`;
    repoDoc.branch = branch;
    repoDoc.status = "importing";
    repoDoc.indexedFiles = 0;
    await repoDoc.save();

    repoId = repoDoc._id.toString();  // MongoDB ID (correct)

    /* ---------------------------------------------
       STEP 5 — Fetch Repo Tree
    --------------------------------------------- */
    const tree = await axios
      .get(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers: { Authorization: `Bearer ${githubToken}` } }
      )
      .then((res) => res.data.tree);

    const codeFiles = tree.filter((f) => {
      if (f.type !== "blob") return false;
      if (f.path.startsWith(".")) return false;
      if (f.path.includes("node_modules")) return false;
      if (f.path.includes("dist") || f.path.includes("build")) return false;
      if (BINARY_EXT_REGEX.test(f.path)) return false;
      return true;
    });

    repoDoc.fileCount = codeFiles.length;
    await repoDoc.save();

    /* ============================================================================
       PROCESS EACH FILE
    ============================================================================ */
    for (let i = 0; i < codeFiles.length; i++) {
      const filePath = codeFiles[i].path;

      sendProgress(repoId, {
        type: "FILE_START",
        file: filePath,
        fileIndex: i + 1,
        fileTotal: codeFiles.length,
      });

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

      if (!raw || isBinaryContent(raw)) continue;

      const hash = sha256(raw);

      let fileDoc = await File.findOne({
        repoId: repoDoc._id,      // Mongo ID match (correct)
        filePath,
      });

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

      // Remove old embeddings/graph if changed
      if (changed) {
        await Embedding.deleteMany({ fileId: fileDoc._id });
        await FunctionNode.deleteMany({ fileId: fileDoc._id });
      }

      /* Function graph */
      const functions = extractFunctions(raw, fileDoc._id, repoDoc._id);
      const calls = detectCalls(raw.split("\n"), functions);
      if (calls.length > 0) {
        await FunctionNode.insertMany(calls);
      }

      /* Chunk + Embeddings */
      if (changed) {
        const chunks = chunkText(raw);

        for (let ci = 0; ci < chunks.length; ci++) {
          const chunk = chunks[ci].trim();
          if (!chunk) continue;

          const isCodeChunk = isCode(chunk);
          const model = isCodeChunk
            ? "mxbai-embed-large"
            : "nomic-embed-text";

          sendProgress(repoId, {
            type: "CHUNK_PROGRESS",
            file: filePath,
            chunkIndex: ci + 1,
            chunkTotal: chunks.length,
            fileIndex: i + 1,
            fileTotal: codeFiles.length,
            model,
            isCode: isCodeChunk,
          });

          const emb = await generateEmbedding(chunk);
          if (!emb) continue;

          await Embedding.create({
            repoId: repoDoc._id,
            fileId: fileDoc._id,
            chunkIndex: ci,
            content: chunk,
            embedding: emb,
            model,
            hash: sha256(chunk),
            tokenCount: countTokens(chunk),
          });
        }
      }

      repoDoc.indexedFiles = i + 1;
      await repoDoc.save();

      sendProgress(repoId, {
        type: "FILE_DONE",
        file: filePath,
        fileIndex: i + 1,
        fileTotal: codeFiles.length,
      });
    }

    /* Reverse graph */
    const allNodes = await FunctionNode.find({ repoId: repoDoc._id });
    for (const target of allNodes) {
      const callers = allNodes
        .filter((n) => n.calls.includes(target.name))
        .map((n) => n.name);
      target.calledBy = callers;
      await target.save();
    }

    /* Finalize */
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

    if (sendProgress && repoId) {
      sendProgress(repoId, {
        type: "ERROR",
        message: err.message,
      });
    }

    return { success: false, message: err.message };
  }
}

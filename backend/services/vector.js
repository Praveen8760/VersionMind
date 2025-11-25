

// services/vector.js

import Embedding from "../models/Embedding.js";
import File from "../models/File.js";
import axios from "axios";

/* ============================================================
   OLLAMA EMBEDDING CALL (nomic-embed-text)
============================================================ */
export async function generateEmbedding(text) {
  try {
    const response = await axios.post(
      "http://localhost:11434/api/embeddings",
      {
        model: "nomic-embed-text",
        prompt: text,
      },
      { timeout: 60000 }
    );

    return response.data.embedding;
  } catch (err) {
    console.error("❌ Embedding Error:", err.message);
    throw new Error("Embedding generation failed");
  }
}

/* ============================================================
   TOKEN COUNTER (simple + fast)
============================================================ */
export function countTokens(text) {
  if (!text) return 0;
  return text.split(/\s+/).length;
}

/* ============================================================
   COSINE SIMILARITY
============================================================ */
export function cosineSim(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dot = 0,
    magA = 0,
    magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] ** 2;
    magB += vecB[i] ** 2;
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/* ============================================================
   LOAD ALL CHUNKS OF A REPO (very fast)
============================================================ */
export async function loadRepoChunks(repoId) {
  return await Embedding.find({ repoId }).lean();
}

/* ============================================================
   TOP-K VECTOR SEARCH
============================================================ */
export async function searchSimilarChunks({ repoId, query, topK = 5 }) {
  // 1) embed the query
  const queryEmbedding = await generateEmbedding(query);

  // 2) load all chunks
  const chunks = await loadRepoChunks(repoId);

  if (!chunks.length) {
    console.warn("⚠️ No embeddings found for repo:", repoId);
    return [];
  }

  // 3) compute similarity
  const scored = chunks.map((chunk) => ({
    ...chunk,
    score: cosineSim(queryEmbedding, chunk.embedding),
  }));

  // 4) sort + return top K
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/* ============================================================
   FETCH FULL FILE CONTENT FOR CHOSEN CHUNKS
============================================================ */
export async function fetchFileById(fileId) {
  return await File.findById(fileId).lean();
}



// services/vector.js

import Embedding from "../models/Embedding.js";
import File from "../models/File.js";
import axios from "axios";

/* ---------------------------------------------------------
   0. BASIC UTILITIES
--------------------------------------------------------- */
function ensureText(t) {
  if (!t) return "";
  return String(t).replace(/\u0000/g, "");
}

/* ---------------------------------------------------------
   1. DETECT IF QUERY IS CODE-LIKE
--------------------------------------------------------- */
function isCodeQuery(query) {
  const patterns = [
    /\w+\(/,              // functionName(
    /class\s+\w+/,        // class Something
    /def\s+\w+/,          // Python def
    /\breturn\b/,
    /\bconst\b|\blet\b/,
    /=>/,
    /\bimport\b/,
  ];
  return patterns.some((p) => p.test(query));
}

/* ---------------------------------------------------------
   2. DUAL EMBEDDING GENERATOR
   - code text -> mxbai-embed-large
   - normal text -> nomic-embed-text
--------------------------------------------------------- */
export async function generateDualEmbedding(text) {
  text = ensureText(text);
  if (!text) return null;

  const code = isCodeQuery(text);

  const model = code
    ? "mxbai-embed-large"
    : "nomic-embed-text";

  try {
    const res = await axios.post(
      "http://localhost:11434/api/embeddings",
      {
        model,
        prompt: text,
      },
      { timeout: 60000 }
    );

    return res.data.embedding || null;
  } catch (err) {
    console.error("❌ Embedding Error:", err.message);
    return null;
  }
}

/* ---------------------------------------------------------
   3. COSINE SIMILARITY
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
   4. LIGHTWEIGHT BM25-STYLE KEYWORD SCORE
--------------------------------------------------------- */
function bm25Lite(query, content) {
  query = ensureText(query).toLowerCase();
  content = ensureText(content).toLowerCase();
  if (!query || !content) return 0;

  const terms = query.split(/\W+/).filter(Boolean);

  let score = 0;
  for (let t of terms) {
    if (content.includes(t)) score += 1;
  }
  return score / terms.length;
}

/* ---------------------------------------------------------
   5. LOAD ALL CHUNKS OF A REPO
--------------------------------------------------------- */
export async function loadRepoChunks(repoId) {
  return await Embedding.find({ repoId }).lean();
}

/* ---------------------------------------------------------
   6. HYBRID TOP-K SEARCH (VECTOR + BM25)
--------------------------------------------------------- */
export async function searchSimilarChunks({ repoId, query, topK = 6 }) {
  query = ensureText(query);
  if (!query) return [];

  // 1) Embed query using the correct model
  const queryEmbedding = await generateDualEmbedding(query);
  if (!queryEmbedding) return [];

  // 2) Load stored embeddings
  const chunks = await loadRepoChunks(repoId);
  if (!chunks.length) {
    console.warn("⚠ No embeddings found for repo:", repoId);
    return [];
  }

  const isCode = isCodeQuery(query);

  // 3) Compute hybrid score
  const scored = chunks.map((chunk) => {
    const vectorScore = cosineSim(queryEmbedding, chunk.embedding || []);
    const lexicalScore = bm25Lite(query, chunk.content || "");

    // Strong bias if query is code
    const codeBoost = isCode && chunk.model === "mxbai-embed-large" ? 1.2 : 1;

    const hybridScore =
      (vectorScore * 0.7 + lexicalScore * 0.3) * codeBoost;

    return {
      ...chunk,
      score: hybridScore,
      vectorScore,
      keywordScore: lexicalScore,
    };
  });

  // 4) Sort & return
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

/* ---------------------------------------------------------
   7. FETCH FULL FILE CONTENT
--------------------------------------------------------- */
export async function fetchFileById(fileId) {
  return await File.findById(fileId).lean();
}

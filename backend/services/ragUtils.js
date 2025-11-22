// backend/services/ragUtils.js

import axios from "axios";

/* ---------------------------------------------------------
   1. TOKEN COUNTER (lightweight & fast)
------------------------------------------------------------ */
export function countTokens(text) {
  if (!text) return 0;

  // Approx count: words * 1.3 → close to GPT token estimate
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

/* ---------------------------------------------------------
   2. TEXT CHUNKING (safe & prevents overflow)
------------------------------------------------------------ */
export function chunkText(text, maxTokens = 500) {
  if (!text) return [];

  const lines = text.split("\n");
  const chunks = [];

  let current = [];
  let currentTokens = 0;

  for (const line of lines) {
    if (!line.trim()) continue; // skip empty lines

    const lineTokens = countTokens(line);

    // If adding this line exceeds limit → push chunk
    if (currentTokens + lineTokens > maxTokens) {
      chunks.push(current.join("\n"));
      current = [line];
      currentTokens = lineTokens;
    } else {
      current.push(line);
      currentTokens += lineTokens;
    }
  }

  // Push remaining chunk
  if (current.length > 0) {
    chunks.push(current.join("\n"));
  }

  return chunks;
}

/* ---------------------------------------------------------
   3. GENERATE EMBEDDING USING OLLAMA (FIXED)
------------------------------------------------------------ */
export async function generateEmbedding(text) {
  try {
    const res = await axios.post("http://localhost:11434/api/embeddings", {
      model: "nomic-embed-text",
      input: text   // <-- FIXED ✔ (Ollama uses `input`)
    });

    return res.data.embedding;

  } catch (err) {
    console.error(
      "Ollama Embedding Error:",
      err.response?.data || err.message
    );

    return []; // fail-safe empty embedding
  }
}

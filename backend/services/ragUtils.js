

// backend/services/ragUtils.js
import axios from "axios";

/* ---------------------------------------------------------
   0. Check if content is valid UTF-8 text
------------------------------------------------------------ */
export function ensureText(input) {
  if (!input) return "";

  // If buffer → convert
  if (Buffer.isBuffer(input)) {
    try {
      return input.toString("utf8");
    } catch {
      return null; // binary data → reject
    }
  }

  // If not string → try converting
  if (typeof input !== "string") {
    try {
      input = String(input);
    } catch {
      return null;
    }
  }

  // Detect binary file (contains many null bytes)
  if (/[\x00-\x08\x0E-\x1F]/.test(input)) {
    return null;
  }

  return input;
}

/* ---------------------------------------------------------
   1. TOKEN COUNTER (safe + crash-proof)
------------------------------------------------------------ */
export function countTokens(text) {
  text = ensureText(text);
  if (!text) return 0;

  return Math.ceil(text.split(/\s+/).length * 1.3);
}

/* ---------------------------------------------------------
   2. TEXT CHUNKING (safe & prevents overflow)
------------------------------------------------------------ */
export function chunkText(text, maxTokens = 500) {
  text = ensureText(text);
  if (!text) return [];

  const lines = text.split("\n");
  const chunks = [];

  let current = [];
  let currentTokens = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    const lineTokens = countTokens(line);

    if (currentTokens + lineTokens > maxTokens) {
      chunks.push(current.join("\n"));
      current = [line];
      currentTokens = lineTokens;
    } else {
      current.push(line);
      currentTokens += lineTokens;
    }
  }

  if (current.length > 0) chunks.push(current.join("\n"));

  return chunks;
}

/* ---------------------------------------------------------
   3. GENERATE EMBEDDING USING OLLAMA (fixed + hardened)
------------------------------------------------------------ */
export async function generateEmbedding(text) {
  text = ensureText(text);
  if (!text) return null;

  try {
    const res = await axios.post(
      "http://localhost:11434/api/embeddings",
      {
        model: "nomic-embed-text",
        prompt: text
      }
    );

    return res.data.embedding;
  } 
  catch (err) {
    console.error("Ollama Embedding Error:", err.response?.data || err.message);
    return null;
  }
}

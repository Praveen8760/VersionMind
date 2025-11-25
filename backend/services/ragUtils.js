
// backend/services/ragUtils.js

import axios from "axios";

/* ---------------------------------------------------------
   0. BASIC TEXT SANITIZER
--------------------------------------------------------- */
export function ensureText(input) {
  if (!input) return "";

  if (Buffer.isBuffer(input)) {
    try {
      return input.toString("utf8");
    } catch {
      return "";
    }
  }

  if (typeof input !== "string") {
    try {
      input = String(input);
    } catch {
      return "";
    }
  }

  return input.replace(/\u0000/g, ""); // remove null chars
}

/* ---------------------------------------------------------
   1. TOKEN COUNTER (simple, safe)
--------------------------------------------------------- */
export function countTokens(text) {
  text = ensureText(text);
  if (!text) return 0;
  return Math.ceil(text.split(/\s+/).length * 1.2);
}

/* ---------------------------------------------------------
   2. DETECT IF TEXT IS CODE
--------------------------------------------------------- */
export function isCode(text) {
  const patterns = [
    /function\s+\w+/,
    /class\s+\w+/,
    /=\s*\([\w\s,]*\)\s*=>/,
    /\bdef\s+\w+/,
    /\bpublic\s+\w+/,
    /\bimport\s+[\w]/,
    /\bconsole\.log/,
    /\breturn\b/,
    /\{/,
  ];

  return patterns.some((p) => p.test(text));
}

/* ---------------------------------------------------------
   3. SMART CHUNKING
   - Keeps functions/classes together
   - Splits long logic blocks
--------------------------------------------------------- */
export function chunkText(text, maxTokens = 400) {
  text = ensureText(text);
  if (!text) return [];

  const lines = text.split("\n");
  const chunks = [];

  let current = [];
  let tokenCount = 0;

  const pushChunk = () => {
    if (current.length) chunks.push(current.join("\n"));
    current = [];
    tokenCount = 0;
  };

  for (let line of lines) {
    const lineTokens = countTokens(line);

    // Start new chunk at function/class definition
    if (/^(def|class|function|async|export)/.test(line.trim())) {
      pushChunk();
    }

    if (tokenCount + lineTokens > maxTokens) {
      pushChunk();
    }

    current.push(line);
    tokenCount += lineTokens;
  }

  if (current.length) pushChunk();

  return chunks;
}

/* ---------------------------------------------------------
   4. DUAL EMBEDDING GENERATOR
   - Code chunks → mxbai-embed-large
   - Text chunks → nomic-embed-text
--------------------------------------------------------- */
export async function generateEmbedding(text) {
  text = ensureText(text);
  if (!text) return null;

  const usingCodeModel = isCode(text);
  const model = usingCodeModel
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

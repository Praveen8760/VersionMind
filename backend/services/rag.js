

// backend/services/rag.js

import Embedding from "../models/Embedding.js";
import File from "../models/File.js";
import Repo from "../models/Repo.js";
import axios from "axios";
import { ensureText, generateEmbedding } from "./ragUtils.js";

/* ============================================================================
   0. Debug Wrapper
============================================================================= */
function log(...args) {
  console.log("🔍 [RAG]", ...args);
}

/* ============================================================================
   1. GET TOP MATCHING CHUNKS (VECTOR SEARCH)
============================================================================= */
export async function retrieveRelevantChunks({ repoId, query, topK = 6 }) {
  log(`Vector search started for repo=${repoId}`);

  const cleanQuery = ensureText(query);
  if (!cleanQuery) {
    log("❌ Query invalid after ensureText()");
    return [];
  }

  log("Generating query embedding...");
  const queryEmbedding = await generateEmbedding(cleanQuery);

  if (!queryEmbedding) {
    log("❌ Query embedding failed");
    return [];
  }
  log("Query embedding length:", queryEmbedding.length);

  // Fetch embeddings
  log("Fetching repo embeddings...");
  const embeddings = await Embedding.find({ repoId }).lean();

  if (embeddings.length === 0) {
    log("⚠ No embeddings indexed for this repo");
    return [];
  }
  log(`Found ${embeddings.length} vector chunks`);

  // Compute similarity
  const scored = embeddings.map((emb) => {
    const vec = emb.embedding;
    const score = cosineSimilarity(queryEmbedding, vec);
    return { ...emb, score };
  });

  // Sort & slice
  scored.sort((a, b) => b.score - a.score);
  const topChunks = scored.slice(0, topK);

  log("Top K Scores:", topChunks.map((c) => c.score.toFixed(3)));

  return topChunks;
}

/* ============================================================================
   2. COSINE SIMILARITY
============================================================================= */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;

  let dot = 0, magA = 0, magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-8);
}

/* ============================================================================
   3. BUILD PROMPT (Improved Formatting)
============================================================================= */
export async function buildPrompt({ query, chunks }) {
  log("Building final LLM prompt...");

  let formattedChunks = "";

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];

    const fileInfo = await File.findById(c.fileId).lean();
    const fileName = fileInfo?.filePath || "unknown_file";

    formattedChunks += `
-------------------------------
🔹 CHUNK ${i + 1}
📄 FILE: ${fileName}
⭐ SCORE: ${c.score.toFixed(3)}
-------------------------------
${c.content}
`;
  }

  return `
You are a senior software engineer assistant.
Answer ONLY using the context from the repository.

If the answer is not found in the provided context, reply:
"I cannot find this in the repository."

================================================================================
USER QUESTION:
${query}
================================================================================

CONTEXT FROM REPOSITORY:
${formattedChunks}

================================================================================
Provide a concise, accurate, and technically correct response.
Use bullet points and code blocks when helpful.
`;
}

/* ============================================================================
   4. STREAM OLLAMA RESPONSE WITH BETTER LOGGING
============================================================================= */

// backend/services/rag.js

export async function streamOllamaResponse({ model = "qwen2.5-coder:7b", prompt, sendToken }) {
  log("Starting Ollama streaming via /api/chat ...");

  try {
    const res = await axios({
      method: "POST",
      url: "http://localhost:11434/api/chat",
      responseType: "stream",
      data: {
        model,
        messages: [{ role: "user", content: prompt }],
        stream: true
      }
    });

    let buffer = "";
    let lastToken = "";  // <— prevents duplicates

    res.data.on("data", (chunk) => {
      buffer += chunk.toString();

      // Split JSON lines
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep last incomplete line

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const json = JSON.parse(line);

          if (json.message?.content) {
            const token = json.message.content;

            // Prevent duplicate token chunks
            if (token === lastToken) continue;
            lastToken = token;

            sendToken(token);
          }
        } catch (e) {
          log("⚠ JSON parse error:", line);
        }
      }
    });

    return new Promise((resolve) => {
      res.data.on("end", () => {
        log("Ollama stream finished");
        resolve();
      });
    });

  } catch (err) {
    log("❌ Ollama Chat Error:", err.message);
    sendToken("[ERROR: Ollama failed to stream response]");
  }
}




// ============================================================================
// 5. MAIN RAG PIPELINE (with Big Debug Logs)
// ============================================================================
export async function runRAG({ repoId, query, sendToken }) {
  try {
    log("🚀 RAG Pipeline started");
    log("Repo:", repoId);
    log("Query:", query);

    // Retrieve best chunks
    const chunks = await retrieveRelevantChunks({ repoId, query, topK: 6 });

    if (chunks.length === 0) {
      log("⚠ No matching chunks found");
      sendToken("I cannot find anything related to this in the repository.");
      return;
    }

    // Build prompt
    const prompt = await buildPrompt({ query, chunks });

    log("Prompt built. Prompt length:", prompt.length);

    // Stream final answer using correct model
    await streamOllamaResponse({
      model: "qwen2.5-coder:7b",     // ✅ FIXED HERE
      prompt,
      sendToken,
    });

    log("RAG Pipeline finished.");

  } catch (err) {
    log("❌ RAG Error:", err);
    sendToken("[RAG ERROR] " + err.message);
  }
}




// backend/services/rag.js

import File from "../models/File.js";
import Repo from "../models/Repo.js";
import {
  searchSimilarChunks,
  fetchFileById
} from "./vector.js";

import { ensureText, isCode } from "./ragUtils.js";
import axios from "axios";

/* ============================================================================
   LOGGING
============================================================================= */
function log(...args) {
  console.log("🔍 [RAG]", ...args);
}

/* ============================================================================
   1. HYBRID RETRIEVAL WRAPPER
============================================================================= */
export async function retrieveRelevantChunks({ repoId, query, topK = 6 }) {
  log("🔎 Hybrid Retrieval Started...");

  const clean = ensureText(query);
  if (!clean) return [];

  const chunks = await searchSimilarChunks({ repoId, query: clean, topK });

  if (!chunks.length) {
    log("⚠ No chunks returned by hybrid search");
    return [];
  }

  log(`📌 Retrieved Top ${chunks.length} Chunks`);
  return chunks;
}

/* ============================================================================
   2. GROUP CHUNKS BY FILE
============================================================================= */
async function groupChunksByFile(chunks) {
  const grouped = {};

  for (const c of chunks) {
    try {
      const file = await fetchFileById(c.fileId);
      const name = file?.filePath || "unknown_file";

      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(c);
    } catch {
      continue;
    }
  }

  return grouped;
}

/* ============================================================================
   3. BUILD CONTEXT WITH SMART CODE LINKING
============================================================================= */
function extractFunctionNames(text) {
  const names = [];
  const patterns = [
    /function\s+(\w+)/g,
    /const\s+(\w+)\s*=\s*\(/g,
    /class\s+(\w+)/g,
    /def\s+(\w+)/g,
  ];

  for (const p of patterns) {
    let m;
    while ((m = p.exec(text))) names.push(m[1]);
  }
  return names;
}

/* ============================================================================
   4. BUILD PROMPT
============================================================================= */
export async function buildPrompt({ query, chunks }) {
  log("📝 Building prompt...");

  const grouped = await groupChunksByFile(chunks);

  let fullContext = "";
  let allLinkedFunctions = new Set();

  for (const [fileName, fileChunks] of Object.entries(grouped)) {
    fullContext += `
================================================================================
📄 FILE: ${fileName}
================================================================================
`;

    for (const c of fileChunks) {
      const fnNames = extractFunctionNames(c.content);
      fnNames.forEach((n) => allLinkedFunctions.add(n));

      fullContext += `
-----------------------------
🔹 CHUNK (score ${c.score.toFixed(3)})
-----------------------------
${c.content}
`;
    }
  }

  const fnList = [...allLinkedFunctions]
    .map((f) => `- ${f}`)
    .join("\n");

  return `
You are an expert software engineer.  
Answer ONLY using the context from the repository.

If the answer is not in context, reply:
"I cannot find this in the repository."

================================================================================
USER QUESTION:
${query}
================================================================================

🔍 DETECTED CONTEXT FUNCTIONS:
${fnList || "None found"}
================================================================================

📦 CONTEXT FROM REPOSITORY:
${fullContext}

================================================================================
INSTRUCTIONS FOR ANSWER:
- If user asks about a function → show definition, purpose, flow
- Include related helper functions found in same file
- Provide code excerpts when necessary
- Be concise but technically accurate
- DO NOT hallucinate functions or behavior not shown in context
================================================================================
`;
}

/* ============================================================================
   5. STREAM OLLAMA RESPONSE
============================================================================= */
export async function streamOllamaResponse({
  model = "qwen2.5-coder:7b",
  prompt,
  sendToken,
}) {
  log("📨 Streaming model response...");

  try {
    const res = await axios({
      method: "POST",
      url: "http://localhost:11434/api/chat",
      responseType: "stream",
      data: {
        model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      },
    });

    let buffer = "";
    let lastToken = "";

    res.data.on("data", (chunk) => {
      buffer += chunk.toString();

      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const json = JSON.parse(line);
          const token = json.message?.content;

          if (token && token !== lastToken) {
            lastToken = token;
            sendToken(token);
          }
        } catch {}
      }
    });

    return new Promise((resolve) => {
      res.data.on("end", () => {
        log("✅ Stream finished");
        resolve();
      });
    });
  } catch (err) {
    log("❌ Streaming Error:", err.message);
    sendToken("[ERROR: Failed to stream response]");
  }
}

/* ============================================================================
   6. MAIN RAG PIPELINE
============================================================================= */
export async function runRAG({ repoId, query, sendToken }) {
  try {
    log("🚀 RAG Pipeline BEGIN");
    log("Repo:", repoId);
    log("Query:", query);

    const chunks = await retrieveRelevantChunks({
      repoId,
      query,
      topK: 6,
    });

    if (!chunks.length) {
      sendToken("I cannot find anything related to this in the repository.");
      return;
    }

    const prompt = await buildPrompt({ query, chunks });

    await streamOllamaResponse({
      model: "qwen2.5-coder:7b",
      prompt,
      sendToken,
    });

    log("🏁 RAG Pipeline COMPLETE");
  } catch (err) {
    log("❌ RAG Pipeline Error:", err.message);
    sendToken("[RAG ERROR] " + err.message);
  }
}

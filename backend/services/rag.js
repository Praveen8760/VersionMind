

// backend/services/rag.js

import File from "../models/File.js";
import FunctionNode from "../models/FunctionNode.js";
import {
  searchSimilarChunks,
  fetchFileById
} from "./vector.js";

import { ensureText } from "./ragUtils.js";
import axios from "axios";

/* ============================================================================
   LOGGING
============================================================================= */
const log = (...args) => console.log("🔍 [RAG]", ...args);

/* ============================================================================
   1. INTENT DETECTION → "Explain add()", "What does login() do?"
============================================================================= */
function detectFunctionIntent(query) {
  const regex = /([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*\)/; // matches foo(), bar()
  const match = query.match(regex);
  return match ? match[1] : null;
}

/* ============================================================================
   2. FUNCTION GRAPH LOOKUP
============================================================================= */
async function fetchFunctionGraph(repoId, fnName) {
  const node = await FunctionNode.findOne({ repoId, name: fnName }).lean();
  return node || null;
}

/* ============================================================================
   3. GROUP CHUNKS BY FILE
============================================================================= */
async function groupChunksByFile(chunks) {
  const grouped = {};

  for (const c of chunks) {
    try {
      const file = await fetchFileById(c.fileId);
      const filePath = file?.filePath || "unknown_file";

      if (!grouped[filePath]) grouped[filePath] = [];
      grouped[filePath].push({ ...c, filePath });
    } catch {}
  }

  return grouped;
}

/* ============================================================================
   4. BUILD CONTEXT WITH LINE NUMBERS + FILE NAMES
============================================================================= */
function applyLineNumbers(text) {
  return text
    .split("\n")
    .map((line, idx) => `${String(idx + 1).padStart(4, " ")} | ${line}`)
    .join("\n");
}

/* ============================================================================
   5. BUILD PROMPT (Smart, function-aware)
============================================================================= */
export async function buildPrompt({ repoId, query, chunks }) {
  log("📝 Building final RAG prompt…");

  const functionName = detectFunctionIntent(query);
  let fnContext = "";

  if (functionName) {
    log("📌 Function detected in query:", functionName);

    const graphNode = await fetchFunctionGraph(repoId, functionName);

    if (graphNode) {
      fnContext = `
===============================================================================
📌 FUNCTION GRAPH — ${graphNode.name}
===============================================================================

📄 FILE: ${graphNode.filePath}
📍 Lines: ${graphNode.startLine} - ${graphNode.endLine}

🔻 CALLS:
${graphNode.calls.length ? graphNode.calls.map(f => " - " + f).join("\n") : " - None"}

🔺 CALLED BY:
${graphNode.calledBy.length ? graphNode.calledBy.map(f => " - " + f).join("\n") : " - None"}

`;
    }
  }

  const grouped = await groupChunksByFile(chunks);

  let chunkContext = "";
  for (const [filePath, fileChunks] of Object.entries(grouped)) {
    chunkContext += `
===============================================================================
📄 FILE: ${filePath}
===============================================================================
`;

    for (const c of fileChunks) {
      const numbered = applyLineNumbers(c.content);

      chunkContext += `
-----------------------------
🔹 CHUNK (score: ${c.score.toFixed(3)})
-----------------------------
${numbered}
`;
    }
  }

  return `
You are a senior software engineer assistant.
Use ONLY the context provided below.

If the answer is NOT in the context, respond exactly:
"I cannot find this in the repository."

===============================================================================
USER QUESTION:
${query}
===============================================================================

${fnContext}

===============================================================================
REPOSITORY CONTEXT:
${chunkContext}

===============================================================================
INSTRUCTIONS:
- If the question is about a function → give definition, purpose, flow
- Reference exact line numbers
- If helper functions exist in graph → explain them
- Avoid hallucination completely
- Use bullet points + code blocks when helpful
===============================================================================
`;
}

/* ============================================================================
   6. STREAM RESPONSE FROM OLLAMA
============================================================================= */
export async function streamOllamaResponse({
  model = "qwen2.5-coder:7b",
  prompt,
  sendToken,
}) {
  log("📨 Streaming model response…");

  try {
    const res = await axios({
      url: "http://localhost:11434/api/chat",
      method: "POST",
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

    return new Promise((resolve) =>
      res.data.on("end", () => {
        log("✅ Stream finished");
        resolve();
      })
    );
  } catch (err) {
    log("❌ Stream Error:", err.message);
    sendToken("[ERROR] Failed to generate response");
  }
}

/* ============================================================================
   7. MAIN RAG PIPELINE
============================================================================= */
export async function runRAG({ repoId, query, sendToken }) {
  try {
    log("🚀 RAG START");
    log("Query:", query);

    const clean = ensureText(query);
    if (!clean) {
      sendToken("Invalid query.");
      return;
    }

    // Hybrid vector search
    const chunks = await searchSimilarChunks({ repoId, query: clean, topK: 8 });

    if (!chunks.length) {
      sendToken("I cannot find anything related to this in the repository.");
      return;
    }

    // Build final prompt
    const prompt = await buildPrompt({ repoId, query: clean, chunks });
    log("📌 Prompt built. Length:", prompt.length);

    // Stream answer
    await streamOllamaResponse({
      model: "qwen2.5-coder:7b",
      prompt,
      sendToken,
    });

    log("🏁 RAG END");
  } 
  catch (err) {
    log("❌ RAG Pipeline Error:", err.message);
    sendToken("[RAG ERROR] " + err.message);
  }
}

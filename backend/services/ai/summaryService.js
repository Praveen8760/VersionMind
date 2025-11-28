

// backend/services/ai/summaryService.js


import { runOllama } from "./ollamaClient.js";
import File from "../../models/File.js";
import FunctionNode from "../../models/FunctionNode.js";

export async function generateSummary(repoId) {
  try {
    const files = await File.find({ repoId }).lean();
    const functions = await FunctionNode.find({ repoId }).lean();

    const prompt = `
You are an expert Software Architect.
Provide a clean summary of this project:

FILES:
${JSON.stringify(files, null, 2)}

FUNCTION GRAPH:
${JSON.stringify(functions, null, 2)}

Explain:
- Architecture
- Core modules
- Hotspots
- Data flow
- Any issues
- Suggestions
`;

    return await runOllama(prompt);
  } catch (err) {
    console.error("SUMMARY SERVICE ERROR", err);
    return "Summary unavailable.";
  }
}

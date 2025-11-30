
// backend/services/ai/readmeService.js

import Repo from "../../models/Repo.js";
import File from "../../models/File.js";
import { runOllama } from "./ollamaClient.js";

export async function generateReadme(repoId) {
  try {
    const repo = await Repo.findById(repoId).lean();
    if (!repo) throw new Error("Repo not found");

    const files = await File.find({ repo: repoId }).lean();

    const fileList = files
      .map((f) => `- ${f.path} (${f.type})`)
      .join("\n");

    const prompt = `
You are an expert technical writer.

Generate a clean, modern README.md for this project.

Project Name: ${repo.repoName}
Total Files: ${files.length}

Project Files:
${fileList}

Rules:
- The README must be clean and professional
- Do NOT use '**' bold markdown because the UI does not support it
- Use plain headers, lists, code blocks and simple formatting
- Include these sections:

1. Project Title
2. Overview
3. Features
4. Tech Stack
5. Folder Structure
6. Installation
7. Usage
8. Example Code Blocks
9. Contributing
10. License

Only output the README, nothing else.
    `;

    const readme = await runOllama(prompt);
    return readme.trim();
  } catch (err) {
    console.error("[README SERVICE ERROR]", err);
    return "README generation unavailable.";
  }
}

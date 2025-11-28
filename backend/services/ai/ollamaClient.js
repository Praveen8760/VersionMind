

// backend/services/ai/ollamaClient.js

import { spawn } from "child_process";

export function runOllama(prompt) {
  return new Promise((resolve, reject) => {
    const process = spawn("ollama", ["run", "llama3.2"], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let output = "";

    process.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });

    process.stderr.on("data", (err) => {
      
    });

    process.on("close", () => resolve(output.trim()));

    process.stdin.write(prompt);
    process.stdin.end();
  });
}


// backend/services/ai/changelogService.js

import Repo from "../../models/Repo.js";
import { runOllama } from "./ollamaClient.js";
import axios from "axios";

/* ------------------------------------------------------
   Fetch recent commits from GitHub
------------------------------------------------------ */
async function fetchCommits(repo) {
  try {
    const url = `https://api.github.com/repos/${repo.repoName}/commits`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "VersionMind-App",
        Accept: "application/vnd.github+json",
      },
      params: { per_page: 20 },
    });

    return response.data.map((c) => ({
      sha: c.sha,
      message: c.commit.message.split("\n")[0],
      author: c.commit.author.name,
      date: c.commit.author.date,
    }));
  } catch (err) {
    console.error("COMMITS FETCH ERROR:", err?.response?.data || err);
    return [];
  }
}


/* ------------------------------------------------------
   Group commits (feat/fix/docs/etc.)
------------------------------------------------------ */
function groupCommits(commits) {
  const groups = {
    added: [],
    fixed: [],
    refactored: [],
    docs: [],
    chore: [],
    test: [],
    other: [],
  };

  commits.forEach((c) => {
    const msg = c.message.toLowerCase();

    if (msg.startsWith("feat")) groups.added.push(c);
    else if (msg.startsWith("fix")) groups.fixed.push(c);
    else if (msg.startsWith("refactor")) groups.refactored.push(c);
    else if (msg.startsWith("docs")) groups.docs.push(c);
    else if (msg.startsWith("chore")) groups.chore.push(c);
    else if (msg.startsWith("test")) groups.test.push(c);
    else groups.other.push(c);
  });

  return groups;
}

/* ------------------------------------------------------
   Generate changelog via Ollama
------------------------------------------------------ */
async function askOllamaForChangelog(commitGroups) {
  const prompt = `
You are an expert release manager.
Convert the grouped commits below into a clean, readable CHANGELOG.md.

Do NOT use any **bold** markdown.

Use clean sections like:
## Added
## Fixed
## Refactored
## Docs
## Tests
## Chore

Commits grouped by type:
${JSON.stringify(commitGroups, null, 2)}

Rules:
- Clean, minimal formatting
- Use simple hyphen bullet points
- No bold text (**)
- Only output the CHANGELOG content
`;

  return await runOllama(prompt);
}

/* ------------------------------------------------------
   MAIN SERVICE (export)
------------------------------------------------------ */
export async function generateChangelog(repoId) {
  try {
    const repo = await Repo.findById(repoId).lean();
    if (!repo) throw new Error("Repo not found");

    const commits = await fetchCommits(repo);
    const grouped = groupCommits(commits);

    const changelog = await askOllamaForChangelog(grouped);

    return {
      commits,
      changelog,
    };
  } catch (err) {
    console.error("CHANGELOG SERVICE ERROR:", err);
    return {
      commits: [],
      changelog: "Changelog unavailable.",
    };
  }
}

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());




// Health check
app.get("/ping", (req, res) => res.send("pong"));

// Analyze GitHub repo
app.post("/api/analyze", async (req, res) => {
  try {
    const { repoUrl } = req.body;
    
    if (!repoUrl) {
      return res.status(400).json({ error: "repoUrl is required" });
    }

    // Remove trailing slash and split URL safely
    const parts = repoUrl.replace(/\/$/, "").split("/");
    if (parts.length < 2) {
      return res.status(400).json({ error: "Invalid GitHub repo URL" });
    }

    const owner = parts[parts.length - 2];
    const repo = parts[parts.length - 1];

    console.log(`Fetching GitHub repo: ${owner}/${repo}`);

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "User-Agent": "VersionMind-App",
        },
      }
    );

    console.log("GitHub API response:", response.data);

    res.json({
      name: response.data.full_name,
      description: response.data.description,
      stars: response.data.stargazers_count,
      forks: response.data.forks_count,
      open_issues: response.data.open_issues_count,
    });
  } 
  catch (err) {
    console.error("Error fetching repo:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running : 3000"));

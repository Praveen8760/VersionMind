import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/ping", (req, res) => res.send("pong"));

// Analyze repo route (basic for tonight)
app.post("/analyze", async (req, res) => {
  try {
    const { repoUrl } = req.body;
    const [owner, repo] = repoUrl.split("/").slice(-2);

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` } }
    );

    res.json({ 
      name: response.data.full_name, 
      stars: response.data.stargazers_count, 
      forks: response.data.forks_count 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));

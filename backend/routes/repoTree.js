
import express from "express";
import File from "../models/File.js";
const router = express.Router();

/* Build nested folder tree */
function buildTree(files) {
  const root = [];

  for (const f of files) {
    const parts = f.filePath.split("/");
    let current = root;

    parts.forEach((part, idx) => {
      let existing = current.find(n => n.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: parts.slice(0, idx + 1).join("/"),
          type: idx === parts.length - 1 ? "file" : "folder",
          children: []
        };

        current.push(existing);
      }

      current = existing.children;
    });
  }

  return root;
}

router.get("/:repoId", async (req, res) => {
  try {
    const repoId = req.params.repoId;

    console.log("📁 Fetching tree for repoId:", repoId);

    const files = await File.find({ repoId }).select("filePath -_id");

    console.log("📝 DB files found:", files.length);

    if (!files.length) {
      return res.json({ success: true, tree: [] });
    }

    const tree = buildTree(files);

    console.log("🌳 Sending tree:", JSON.stringify(tree).slice(0, 200));

    res.json({ success: true, tree });

  } catch (err) {
    console.error("❌ Tree load error:", err);
    res.status(500).json({ success: false, message: "Tree load failed" });
  }
});

export default router;

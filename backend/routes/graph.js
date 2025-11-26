

// backend/routes/graph.js
import express from "express";
import FunctionNode from "../models/FunctionNode.js";

const router = express.Router();

/* ============================================================================
   GET FUNCTION GRAPH FOR A REPO
   Returns: { nodes: [{id}], links: [{source,target}] }
============================================================================ */
router.get("/:repoId", async (req, res) => {
  const repoId = req.params.repoId;
  

  try {
    // -------------------------------------------------------
    // 1. Load all function graph raw nodes
    // -------------------------------------------------------
    const raw = await FunctionNode.find({ repoId }).lean();
    

    if (raw.length === 0) {
      console.log("⚠ [GRAPH] No functions found");
      return res.json({ success: true, nodes: [], links: [] });
    }

    // -------------------------------------------------------
    // 2. Create unique node list
    // -------------------------------------------------------
    const nodeSet = new Set(raw.map(n => n.name)); // unique fn names
    const nodes = [...nodeSet].map(name => ({ id: name }));

    

    // -------------------------------------------------------
    // 3. Build VALID links only
    // -------------------------------------------------------
    const links = [];

    raw.forEach(fn => {
      fn.calls.forEach(target => {
        // Only push links where both sides exist
        if (nodeSet.has(target)) {
          links.push({
            source: fn.name,
            target
          });
        }
      });
    });

    

    // -------------------------------------------------------
    // 4. Return final graph
    // -------------------------------------------------------
    return res.json({
      success: true,
      nodes,
      links
    });

  } catch (err) {
    console.error("❌ [GRAPH] Error building graph:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

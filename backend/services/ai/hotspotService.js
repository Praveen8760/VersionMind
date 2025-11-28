

// backend/services/ai/hotspotService.js

import FunctionNode from "../../models/FunctionNode.js";




export async function generateHotspots(repoId) {
  const nodes = await FunctionNode.find({ repoId }).lean();

  const callCount = {};

  nodes.forEach((n) => {
    n.calls.forEach((c) => {
      callCount[c] = (callCount[c] || 0) + 1;
    });
  });

  const sorted = Object.entries(callCount)
    .sort((a, b) => b[1] - a[1])
    .map(([fn, count]) => ({ fn, count }));

  return sorted.slice(0, 10); // top 10 hotspots
}

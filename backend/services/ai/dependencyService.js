

// backend/services/ai/dependencyService.js

import FunctionNode from "../../models/FunctionNode.js";

export async function generateDependencyInsights(repoId) {
  const nodes = await FunctionNode.find({ repoId }).lean();

  const insights = {
    totalFunctions: nodes.length,
    imports: [],
  };

  nodes.forEach((n) => {
    n.calls.forEach((target) => {
      insights.imports.push({ from: n.name, to: target });
    });
  });

  return insights;
}

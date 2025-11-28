


// backend/services/ai/metricsService.js

import File from "../../models/File.js";

export async function generateMetrics(repoId) {
  const files = await File.find({ repoId }).lean();

  const metrics = {
    totalFiles: files.length,
    languages: {},
    totalSizeKB: 0,
  };

  files.forEach((f) => {
    metrics.totalSizeKB += f.size / 1024;
    const ext = f.extension || "unknown";
    metrics.languages[ext] = (metrics.languages[ext] || 0) + 1;
  });

  return metrics;
}

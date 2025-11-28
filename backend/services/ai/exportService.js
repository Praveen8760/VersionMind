
import { generateSummary } from "./summaryService.js";
import { generateMetrics } from "./metricsService.js";
import { generateDependencyInsights } from "./dependencyService.js";
import { generateHotspots } from "./hotspotService.js";

export async function exportInsights(repoId, format) {
  const summary = await generateSummary(repoId);
  const metrics = await generateMetrics(repoId);
  const deps = await generateDependencyInsights(repoId);
  const hotspots = await generateHotspots(repoId);

  const payload = {
    generatedAt: new Date().toISOString(),
    repoId,
    summary,
    metrics,
    dependencies: deps,
    hotspots
  };

  // JSON EXPORT
  if (format === "json") {
    return {
      name: "insights.json",
      mime: "application/json",
      data: JSON.stringify(payload, null, 2)
    };
  }

  // MARKDOWN EXPORT
  if (format === "md") {
    const md = `
# Project Insights Export

## Summary
${summary}

## Metrics
\`\`\`json
${JSON.stringify(metrics, null, 2)}
\`\`\`

## Hotspots
\`\`\`json
${JSON.stringify(hotspots, null, 2)}
\`\`\`

## Dependencies
\`\`\`json
${JSON.stringify(deps, null, 2)}
\`\`\`
`;
    return {
      name: "insights.md",
      mime: "text/markdown",
      data: md
    };
  }

  // PDF EXPORT (simple)
  if (format === "pdf") {
    const pdfContent = `
Project Insights

Summary:
${summary}

Metrics:
${JSON.stringify(metrics, null, 2)}

Hotspots:
${JSON.stringify(hotspots, null, 2)}

Dependencies:
${JSON.stringify(deps, null, 2)}
`;

    return {
      name: "insights.pdf",
      mime: "application/pdf",
      data: pdfContent // (we can integrate pdf-lib later)
    };
  }

  throw new Error("Unknown export format");
}

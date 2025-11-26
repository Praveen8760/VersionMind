

// src/components/FunctionGraph.jsx
import { useEffect, useState, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import axios from "axios";
import { useRepo } from "../context/RepoContext";

export default function FunctionGraph() {
  const { activeRepo } = useRepo();

  const graphRef = useRef(null);
  const containerRef = useRef(null);

  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);

  /* ------------------------------------------------------------------
     FETCH GRAPH
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!activeRepo) {
      console.log("%c[FunctionGraph] ❌ No active repo", "color:red");
      return;
    }

    console.log(
      "%c[FunctionGraph] 🔍 Fetching graph for:",
      "color:cyan",
      activeRepo.id
    );

    setLoading(true);

    axios
      .get(`http://localhost:3000/api/graph/${activeRepo.id}`, {
        withCredentials: true,
      })
      .then((res) => {
        console.log(
          "%c[FunctionGraph] ✔ Backend Response:",
          "color:gold",
          res.data
        );

        const { nodes = [], links = [] } = res.data;

        console.log(
          `%c[FunctionGraph] 🟦 Nodes(${nodes.length}) 🔗 Links(${links.length})`,
          "color:lightgreen"
        );

        // Validate links to prevent "node not found"
        const ids = new Set(nodes.map((n) => n.id));
        const cleanedLinks = links.filter(
          (l) => ids.has(l.source) && ids.has(l.target)
        );

        setGraph({
          nodes,
          links: cleanedLinks,
        });

        console.log(
          `%c[FunctionGraph] 🧹 Cleaned valid links: ${cleanedLinks.length}`,
          "color:orange"
        );
      })
      .catch((err) =>
        console.error("%c[FunctionGraph] ❌ Load error:", "color:red", err)
      )
      .finally(() => setLoading(false));
  }, [activeRepo]);

  /* ------------------------------------------------------------------
     AUTO-FIT GRAPH ON FIRST STABILIZATION
  ------------------------------------------------------------------ */
  const handleEngineStop = () => {
    console.log("%c[FunctionGraph] 🚀 Layout stabilized!", "color:lime");

    if (graphRef.current) {
      try {
        graphRef.current.zoomToFit(500, 80);
        console.log("%c[FunctionGraph] 🔎 Auto zoom applied", "color:cyan");
      } catch (e) {
        console.warn("[FunctionGraph] ZoomToFit failed:", e);
      }
    }
  };

  /* ------------------------------------------------------------------
     SIZING FIX — MAKE CANVAS VISIBLE
  ------------------------------------------------------------------ */
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resize = () => {
      const w = containerRef.current.offsetWidth;
      const h = containerRef.current.offsetHeight;

      console.log(
        "%c[FunctionGraph] 📐 Resize:",
        "color:violet",
        `Width=${w}, Height=${h}`
      );

      setSize({ w, h });
    };

    resize();
    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, []);

  /* ------------------------------------------------------------------
     NODE COLORS
  ------------------------------------------------------------------ */
  const getNodeColor = (node) => {
    if (node.type === "class") return "#A855F7";
    if (node.type === "method") return "#22D3EE";
    return "#3B82F6";
  };

  /* ------------------------------------------------------------------
     CONDITIONAL RENDER
  ------------------------------------------------------------------ */
  if (!activeRepo)
    return <p className="text-xs text-gray-500 p-3">Select a repository</p>;

  if (loading)
    return <p className="text-xs text-gray-500 p-3">Loading graph…</p>;

  if (graph.nodes.length === 0)
    return <p className="text-xs text-gray-500 p-3">No functions detected.</p>;

  /* ------------------------------------------------------------------
     RENDER GRAPH
  ------------------------------------------------------------------ */
  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden bg-[#0d0f12]"
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graph}
        width={size.w}
        height={size.h}
        cooldownTicks={40}
        linkColor={() => "rgba(255,255,255,0.15)"}
        linkWidth={1.2}
        nodeRelSize={6}
        backgroundColor="#0d0f12"
        onEngineStop={handleEngineStop}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.id;
          const fontSize = 12 / globalScale;

          // Dot
          ctx.fillStyle = getNodeColor(node);
          ctx.beginPath();
          ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
          ctx.fill();

          // Label
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.fillStyle = "white";
          ctx.fillText(label, node.x + 8, node.y + 3);
        }}
        onNodeClick={(node) => {
          console.log(
            "%c[FunctionGraph] 🔵 Node clicked:",
            "color:cyan",
            node
          );
        }}
      />
    </div>
  );
}

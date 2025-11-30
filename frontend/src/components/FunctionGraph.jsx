
// src/components/FunctionGraph.jsx
import { useEffect, useState, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import axios from "axios";
import { useRepo } from "../context/RepoContext";
import { GitBranch } from "lucide-react";

export default function FunctionGraph() {
  const { activeRepo } = useRepo();

  const graphRef = useRef(null);
  const containerRef = useRef(null);

  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState({ w: 800, h: 600 });

  /* ------------------------------------------------------------------
     FETCH GRAPH
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!activeRepo) return;

    setLoading(true);

    axios
      .get(`http://localhost:3000/api/graph/${activeRepo.id}`, {
        withCredentials: true,
      })
      .then((res) => {
        const { nodes = [], links = [] } = res.data;

        const validIds = new Set(nodes.map((n) => n.id));
        const safeLinks = links.filter(
          (l) => validIds.has(l.source) && validIds.has(l.target)
        );

        setGraph({ nodes, links: safeLinks });
      })
      .catch(() => setGraph({ nodes: [], links: [] }))
      .finally(() => setLoading(false));
  }, [activeRepo]);

  /* ------------------------------------------------------------------
     HANDLE GRAPH RESIZE
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!containerRef.current) return;

    const resize = () => {
      setSize({
        w: containerRef.current.offsetWidth,
        h: containerRef.current.offsetHeight,
      });
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  /* ------------------------------------------------------------------
     AUTO-FIT WHEN GRAPH STOPS MOVING
  ------------------------------------------------------------------ */
  const handleEngineStop = () => {
    try {
      graphRef.current?.zoomToFit(600, 80);
    } catch {}
  };

  /* ------------------------------------------------------------------
     NODE COLORS
  ------------------------------------------------------------------ */
  const getNodeColor = (node) => {
    if (node.type === "class") return "#A855F7";
    if (node.type === "method") return "#22D3EE";
    return "#3B82F6";
  };

  /* ------------------------------------------------------------------
     CONDITIONAL STATES
  ------------------------------------------------------------------ */
  if (!activeRepo)
    return (
      <p className="text-xs text-gray-500 p-3">Select a repository</p>
    );

  if (loading)
    return (
      <p className="text-xs text-gray-500 p-3">Loading function graph…</p>
    );

  if (graph.nodes.length === 0)
    return (
      <p className="text-xs text-gray-500 p-3">No functions detected.</p>
    );

  /* ------------------------------------------------------------------
     FINAL RENDER
  ------------------------------------------------------------------ */
  return (
    <div className="w-full h-[50dvh] flex flex-col">

      {/* Heading */}
      <div className="mb-3 px-1">
        <p className="text-lg font-semibold flex items-center gap-2 bg-gradient-to-r 
                      from-cyan-300 to-blue-400 bg-clip-text text-transparent">
          <GitBranch size={18} className="text-cyan-400" />
          Function Graph
        </p>
        <p className="text-xs text-gray-500">
          Visual map of class, method & function relationships
        </p>
      </div>

      {/* Graph Wrapper */}
      <div
        ref={containerRef}
        className="
          flex-1 rounded-xl overflow-hidden 
          bg-[#0d0f12]/90 backdrop-blur-xl
          border border-white/5 
          shadow-[0_0_25px_rgba(0,0,0,0.45)]
        "
      >
        <ForceGraph2D
          ref={graphRef}
          graphData={graph}
          width={size.w}
          height={size.h}
          cooldownTicks={45}
          backgroundColor="#0d0f12"
          linkColor={() => "rgba(255,255,255,0.12)"}
          linkWidth={1.1}
          nodeRelSize={6}
          onEngineStop={handleEngineStop}
          nodeCanvasObject={(node, ctx, scale) => {
            const label = node.id;
            const fontSize = 12 / scale;

            // Node circle
            ctx.fillStyle = getNodeColor(node);
            ctx.beginPath();
            ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
            ctx.fill();

            // Label
            ctx.font = `${fontSize}px Inter, Sans-Serif`;
            ctx.fillStyle = "white";
            ctx.fillText(label, node.x + 8, node.y + 3);
          }}
        />
      </div>
    </div>
  );
}

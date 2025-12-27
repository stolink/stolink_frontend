import { useRef, useState, useEffect } from "react";
import { NetworkGraph, NetworkGraphRef } from "@/components/graph/NetworkGraph";
import { SAMPLE_GRAPH_DATA } from "@/data/sampleGraphData";
import { graphApi, GraphData } from "@/services/graphApi";
import { NetworkNode, NetworkLink } from "@/types/network";

export default function GraphDemoPage() {
  const graphRef = useRef<NetworkGraphRef>(null);

  // Data State
  const [dataSource, setDataSource] = useState<"sample" | "api">("sample");
  const [graphData, setGraphData] = useState<GraphData>(SAMPLE_GRAPH_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch API Data Effect
  useEffect(() => {
    if (dataSource === "api") {
      setLoading(true);
      setError(null);
      graphApi
        .getGraphData()
        .then((data) => {
          setGraphData(data);
        })
        .catch((err) => {
          setError(
            "Failed to connect to Spring Server (http://localhost:8080). Is it running?"
          );
          // Fallback or keep empty? Let's just show error.
        })
        .finally(() => setLoading(false));
    } else {
      setGraphData(SAMPLE_GRAPH_DATA);
      setError(null);
    }
  }, [dataSource]);

  const handleAddNode = () => {
    const newNode: NetworkNode = {
      id: `NewNode-${Date.now()}`,
      name: `New Person ${Math.floor(Math.random() * 100)}`,
      group: Math.floor(Math.random() * 5) + 1,
      radius: 15,
      strength: -300,
    };

    // Connect to 1-2 random existing nodes
    const targets = [];
    const numLinks = Math.random() > 0.5 ? 2 : 1;
    for (let i = 0; i < numLinks; i++) {
      const randomNode =
        graphData.nodes[Math.floor(Math.random() * graphData.nodes.length)];
      targets.push(randomNode);
    }

    const newLinks: NetworkLink[] = targets.map((target) => ({
      source: newNode.id,
      target: target.id,
      value: 1,
    }));

    if (graphRef.current) {
      graphRef.current.addNode(newNode, newLinks);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">
          Character Network Graph
        </h1>
        <div className="flex gap-4 items-center">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setDataSource("sample")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                dataSource === "sample"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Sample Data
            </button>
            <button
              onClick={() => setDataSource("api")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                dataSource === "api"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Real Data (API)
            </button>
          </div>

          <button
            onClick={handleAddNode}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 transition-transform"
          >
            + Add Result
          </button>
        </div>
      </header>

      {error && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
          role="alert"
        >
          <p className="font-bold">Connection Error</p>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-white">
          Loading Data from Spring Server...
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Controls */}
          <aside className="w-80 border-r bg-[#252526] text-[#cccccc] p-6 border-[#3e3e3e]">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Obsidian-Style Graph
            </h2>
            <ul className="mb-8 list-disc pl-5 text-sm space-y-4">
              <li>
                <strong className="text-white">Data Source:</strong> <br />
                <span className="text-xs text-[#999]">
                  {dataSource === "api"
                    ? "Connected to Spring Backend"
                    : "Static Sample Data"}
                </span>
              </li>
              <li>
                <strong className="text-white">Dark Mode & Aesthetics:</strong>{" "}
                <br />
                <span className="text-xs text-[#999]">
                  Minimalist design with dark background, pastel colors, and
                  thin connections. Labels appear only for larger nodes or on
                  selection.
                </span>
              </li>
              <li>
                <strong className="text-white">
                  Focus Mode (Star Topology):
                </strong>{" "}
                <br />
                <span className="text-xs text-[#999]">
                  Click on any node to isolate it. You will see{" "}
                  <strong>only</strong> that node and its direct neighbors. All
                  other nodes and internal links fade away.
                </span>
              </li>
              <li>
                <strong className="text-white">
                  NebulaGraph Optimizations:
                </strong>{" "}
                <br />
                <span className="text-xs text-[#999]">
                  <strong>Stable Addition:</strong> New nodes spawn near their
                  friends.
                  <br />
                  <strong>Curved Edges:</strong> Parallel links curve
                  gracefully.
                </span>
              </li>
            </ul>
          </aside>

          {/* Graph Area */}
          <main className="flex-1 bg-[#1e1e1e] p-4 relative overflow-hidden">
            <NetworkGraph
              ref={graphRef}
              nodes={graphData.nodes}
              links={graphData.links}
              width={1200}
              height={800}
              className="h-full w-full shadow-none border-[#3e3e3e]"
            />
            <div className="absolute bottom-8 right-8 pointer-events-none text-xs text-[#555]">
              D3 v7 Force Directed Graph
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

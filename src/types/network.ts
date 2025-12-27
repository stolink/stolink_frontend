import * as d3 from "d3";

// Node definition extending D3's simulation node
export interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  group: number; // For coloring/grouping
  radius?: number; // Optional custom radius
  strength?: number; // Importance/centrality 1-10

  // D3 Simulation properties (optional but explicit)
  x?: number;
  y?: number;
  fx?: number | null; // Fixed X for dragging
  fy?: number | null; // Fixed Y for dragging
}

// Link definition extending D3's simulation link
export interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  source: string | NetworkNode; // D3 allows string ID or Node object
  target: string | NetworkNode;
  value: number; // Weight/Thickness

  // NebulaGraph Optimization for Multiple Edges
  linkNum?: number; // Index in the group of parallel edges
}

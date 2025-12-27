import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
} from "react";
import * as d3 from "d3";
import type { NetworkNode, NetworkLink } from "@/types/network";
import { cn } from "@/lib/utils";

interface NetworkGraphProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  width?: number;
  height?: number;
  className?: string;
}

export interface NetworkGraphRef {
  addNode: (node: NetworkNode, links: NetworkLink[]) => void;
}

// Obsidian-like Color Palette
const OBSIDIAN_COLORS = d3.scaleOrdinal([
  "#98a1b8", // Default/Group 0
  "#bf8ade", // Purple
  "#d0666f", // Red
  "#d8a657", // Orange
  "#90b985", // Green
  "#6b9fb8", // Blue
]);

export const NetworkGraph = forwardRef<NetworkGraphRef, NetworkGraphProps>(
  (
    {
      nodes: initialNodes,
      links: initialLinks,
      width = 800,
      height = 600,
      className,
    },
    ref,
  ) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // State to track simulation instance and data
    const simulationRef = useRef<d3.Simulation<
      NetworkNode,
      NetworkLink
    > | null>(null);

    // Local state to manage data
    const [graphData, setGraphData] = useState({
      nodes: initialNodes,
      links: initialLinks,
    });
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Filter Logic (Strict Star Topology)
    const getFilteredData = useCallback(() => {
      if (!selectedNodeId) return graphData;

      // Helper to safely get ID from Node or String
      // Helper to safely get ID from Node or String
      const getId = (nodeOrId: string | NetworkNode | unknown): string => {
        if (typeof nodeOrId === "string") return nodeOrId;
        if (nodeOrId && typeof nodeOrId === "object" && "id" in nodeOrId) {
          return String((nodeOrId as NetworkNode).id);
        }
        return "";
      };

      const centerId = String(selectedNodeId);

      // 1. Identify valid neighbors (Nodes directly connected to selectedNodeId)
      // We scan the FULL graph links to find neighbors.
      const neighborIds = new Set<string>();
      graphData.links.forEach((link) => {
        const s = getId(link.source);
        const t = getId(link.target);

        if (s === centerId) neighborIds.add(t);
        if (t === centerId) neighborIds.add(s);
      });

      // 2. Filter Nodes: Only Selected Node + Neighbors
      // We filter from the FULL graph nodes
      const filteredNodes = graphData.nodes.filter((n) => {
        const nid = String(n.id);
        return nid === centerId || neighborIds.has(nid);
      });

      // 3. Filter Links: ONLY links connected to Selected Node
      // This is the critical step. We MUST exclude links between neighbors.
      // Rule: One end of the link MUST be the centerId.
      const filteredLinks = graphData.links.filter((link) => {
        const s = getId(link.source);
        const t = getId(link.target);

        // Strict Star Topology: Link must touch the center.
        return s === centerId || t === centerId;
      });

      return { nodes: filteredNodes, links: filteredLinks };
    }, [graphData, selectedNodeId]);

    // Imperative Handle for Adding Nodes
    useImperativeHandle(ref, () => ({
      addNode: (newNode, newLinks) => {
        setGraphData((prev) => {
          // NebulaGraph Optimization: Center Extraction
          // Find neighbors to position new node
          // We need to look up current positions of neighbors from the RUNNING simulation if possible

          if (simulationRef.current) {
            const currentSimNodes = simulationRef.current.nodes();
            const connectedNodeIds = newLinks.map((l) =>
              typeof l.source === "string"
                ? l.source
                : (l.source as NetworkNode).id === newNode.id
                  ? typeof l.target === "string"
                    ? l.target
                    : (l.target as NetworkNode).id
                  : typeof l.source === "string"
                    ? l.source
                    : (l.source as NetworkNode).id,
            );

            const neighbors = currentSimNodes.filter((n) =>
              connectedNodeIds.includes(n.id),
            );
            if (neighbors.length > 0) {
              newNode.x =
                (d3.mean(neighbors, (n) => n.x) || width / 2) +
                (Math.random() - 0.5) * 10;
              newNode.y =
                (d3.mean(neighbors, (n) => n.y) || height / 2) +
                (Math.random() - 0.5) * 10;
            } else {
              newNode.x = width / 2;
              newNode.y = height / 2;
            }
          }

          return {
            nodes: [...prev.nodes, newNode],
            links: [...prev.links, ...newLinks],
          };
        });
        // Reset focus mode to show new node context
        setSelectedNodeId(null);
      },
    }));

    // Main D3 Effect
    useEffect(() => {
      if (!svgRef.current) return;

      const { nodes, links } = getFilteredData();

      // Logic:
      // 1. Process Links for Curvature (NebulaGraph Optimization)
      // We need to re-calc this every time data changes
      const processLinks = (rawLinks: NetworkLink[]) => {
        const pairMap = new Map<string, NetworkLink[]>();
        const safeGetId = (item: string | NetworkNode | unknown) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "id" in item)
            return (item as NetworkNode).id;
          return String(item);
        };
        rawLinks.forEach((link) => {
          const s = safeGetId(link.source);
          const t = safeGetId(link.target);
          const key = s < t ? `${s}-${t}` : `${t}-${s}`;
          if (!pairMap.has(key)) pairMap.set(key, []);
          pairMap.get(key)!.push(link);
        });
        pairMap.forEach((group) => {
          const mid = (group.length - 1) / 2;
          group.forEach((l, i) => (l.linkNum = i - mid));
        });
        return rawLinks; // D3 will bind objects
      };
      const processedLinks = processLinks([...links]);
      const currentNodes = [...nodes]; // Array copy

      // Clear existing SVG content
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      // Create container group for Zoom
      const g = svg.append("g");

      // Zoom Behavior
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (e) => g.attr("transform", e.transform));
      svg.call(zoom).on("dblclick.zoom", null); // Disable double click zoom

      // Background click to clear selection
      svg.on("click", (e) => {
        if (e.target === svgRef.current) setSelectedNodeId(null);
      });

      // Simulation Setup
      const simulation = d3
        .forceSimulation<NetworkNode, NetworkLink>(currentNodes)
        .force(
          "charge",
          d3.forceManyBody().strength(() => (selectedNodeId ? -1000 : -400)),
        ) // Spread more if focused?
        .force(
          "link",
          d3
            .forceLink<NetworkNode, NetworkLink>(processedLinks)
            .id((d) => d.id)
            .distance(100),
        )
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force(
          "collide",
          d3
            .forceCollide<NetworkNode>((d) => (d.radius || 20) + 10)
            .iterations(2),
        );

      simulationRef.current = simulation;

      // Render Links
      // We use 'path' for curves, Observable usage used 'line'
      const link = g
        .append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(processedLinks)
        .join("path")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", (d) => Math.sqrt(d.value || 1))
        .attr("fill", "none");

      // Render Nodes
      const node = g
        .append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(currentNodes)
        .join("circle")
        .attr("r", (d) => (d.radius || 5) + (selectedNodeId === d.id ? 5 : 0))
        .attr("fill", (d) => OBSIDIAN_COLORS(String(d.group)))
        .attr("stroke", (d) =>
          selectedNodeId === d.id ? "#fff" : "transparent",
        )
        .attr("stroke-width", 2)
        .attr("cursor", "pointer")
        .on("click", (e, d) => {
          e.stopPropagation();
          setSelectedNodeId((prev) => (prev === d.id ? null : d.id));
        });

      // Node Labels
      const label = g
        .append("g")
        .attr("class", "labels")
        .style("pointer-events", "none")
        .selectAll("text")
        .data(currentNodes)
        .join("text")
        .text((d) => d.name)
        .attr("text-anchor", "middle")
        .attr("fill", "#ccc")
        .style("font-size", "10px")
        .style("font-family", "sans-serif")
        .style("opacity", (d) =>
          selectedNodeId && d.id !== selectedNodeId ? 0.5 : 0.9,
        )
        .style("visibility", (d) =>
          (d.radius || 5) < 10 && !selectedNodeId ? "hidden" : "visible",
        );
      // Apply drag behavior
      (node as d3.Selection<Element, NetworkNode, SVGGElement, unknown>).call(
        d3
          .drag<Element, NetworkNode>()
          .on("start", (e, d) => {
            if (!e.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (e, d) => {
            d.fx = e.x;
            d.fy = e.y;
          })
          .on("end", (e, d) => {
            if (!e.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

      // Tick Function
      simulation.on("tick", () => {
        link.attr("d", (d) => {
          const source = d.source as NetworkNode;
          const target = d.target as NetworkNode;

          // Straight line check
          if (!d.linkNum || Math.abs(d.linkNum) < 0.1) {
            return `M${source.x},${source.y} L${target.x},${target.y}`;
          }

          // Curve logic
          const x1 = source.x!,
            y1 = source.y!;
          const x2 = target.x!,
            y2 = target.y!;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dy / dist;
          const ny = dx / dist;
          const curveAmount = 30 * d.linkNum;
          const cx = mx + nx * curveAmount;
          const cy = my + ny * curveAmount;

          return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
        });

        node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);

        label
          .attr("x", (d) => d.x!)
          .attr("y", (d) => d.y! + (d.radius || 5) + 12);
      });

      // Cleanup
      return () => {
        simulation.stop();
      };
    }, [width, height, getFilteredData, selectedNodeId]); // Re-run when data/filter changes

    return (
      <div
        ref={wrapperRef}
        className={cn(
          "border rounded-lg overflow-hidden bg-[#1e1e1e] shadow-inner font-sans",
          className,
        )}
      >
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="select-none"
          style={{ backgroundColor: "#1e1e1e" }}
        />
      </div>
    );
  },
);

NetworkGraph.displayName = "NetworkGraph";

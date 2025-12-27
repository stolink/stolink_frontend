import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { NetworkNode, NetworkLink } from "@/types/network";

interface UseNetworkSimulationOptions {
  width: number;
  height: number;
  initialNodes: NetworkNode[];
  initialLinks: NetworkLink[];
}

export function useNetworkSimulation({
  width,
  height,
  initialNodes,
  initialLinks,
}: UseNetworkSimulationOptions) {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [links, setLinks] = useState<NetworkLink[]>([]);

  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkLink> | null>(
    null
  );

  // Initialize simulation
  useEffect(() => {
    // 1. Process Links for Curvature (NebulaGraph Optimization)
    // Group links by source-target pair and assign linkNum
    const processedLinks = processParallelLinks(initialLinks);

    // Deep copy to prevent mutation issues with Strict Mode
    const nodesCopy = initialNodes.map((n) => ({ ...n }));
    const linksCopy = processedLinks.map((l) => ({ ...l }));

    const simulation = d3
      .forceSimulation<NetworkNode, NetworkLink>(nodesCopy)
      .force("charge", d3.forceManyBody().strength(-300).distanceMax(300))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force(
        "link",
        d3
          .forceLink<NetworkNode, NetworkLink>(linksCopy)
          .id((d) => d.id)
          .distance(100)
      )
      .force(
        "collide",
        d3.forceCollide((d) => (d.radius || 20) + 5).iterations(2)
      );

    simulation.on("tick", () => {
      // Trigger re-render on tick
      // Optimization: In a real app with many nodes, might use refs or requestAnimationFrame
      // For 30 nodes, state update is fine.
      setNodes([...simulation.nodes()]);
      setLinks([...linksCopy]);
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [width, height, initialNodes, initialLinks]); // Re-run if fully reset

  // --- NebulaGraph Optimization 1: Dynamic Node Addition ---
  const addNode = useCallback(
    (newNode: NetworkNode, newLinks: NetworkLink[]) => {
      if (!simulationRef.current) return;

      const sim = simulationRef.current;
      const currentNodes = sim.nodes();
      const currentLinks = links; // Current state links including mapped objects

      // 1. Calculate Initial Position based on Neighbors
      // Find all neighbor nodes currently in the graph
      const connectedNodeIds = newLinks.map((l) =>
        typeof l.source === "string"
          ? l.source
          : (l.source as NetworkNode).id === newNode.id
            ? typeof l.target === "string"
              ? l.target
              : (l.target as NetworkNode).id
            : typeof l.source === "string"
              ? l.source
              : (l.source as NetworkNode).id
      );

      const neighbors = currentNodes.filter((n) =>
        connectedNodeIds.includes(n.id)
      );

      if (neighbors.length > 0) {
        // Average position of neighbors
        const avgX = d3.mean(neighbors, (n) => n.x) || width / 2;
        const avgY = d3.mean(neighbors, (n) => n.y) || height / 2;

        // Set initial position (NebulaGraph recommendation: center of source nodes)
        newNode.x = avgX + (Math.random() - 0.5) * 10;
        newNode.y = avgY + (Math.random() - 0.5) * 10;
      } else {
        // Fallback: Graph center
        newNode.x = width / 2;
        newNode.y = height / 2;
      }

      // 2. Update Data
      const updatedNodes = [...currentNodes, newNode];
      // Need to re-process ALL links for curvature if new links are added to existing parallel groups
      // For simplicity, we just append here, but ideally we re-run processParallelLinks if adding parallel edges
      // Let's assume new links might be parallel to existing ones
      // We need to convert currentLinks back to raw form partially to re-process?
      // Actually, forceLink modifies the objects.

      // Simplification for this demo: Just append new links and re-process only those that might be parallel
      // or just re-run standard D3 update pattern

      const allRawLinks = [...currentLinks, ...newLinks];
      // Note: currentLinks already has source/target as Objects.
      // newLinks has strings. D3 handles mixed types if we are careful, but safer to re-process carefully.

      // To handle curvature correctly for DYNAMIC additions, we should really re-group.
      // However, since objects are already bound, we need to be careful not to break references.
      // For now, let's just add them and let D3 re-bind.

      sim.nodes(updatedNodes);

      const linkForce =
        sim.force<d3.ForceLink<NetworkNode, NetworkLink>>("link");
      if (linkForce) {
        // We need to preserve existing object references for existing links to avoid "jumping"
        // But for new links, they are fresh.
        // Re-calculating curvature:
        // A simple approach is to tag only the new links, but for true correctness we might need to update existing linkNums
        // if a new link is added parallel to an existing one.

        // Let's do a lightweight curvature update:
        // (For this demo, we assume added node is NEW, so its links won't parallel existing links to EACH OTHER,
        // but could parallel an existing edge? No, if node is new, all edges are new.)
        // So we only need to check if we are adding MULTIPLE edges to the new node.

        // ... Logic to assign linkNum for newLinks ...
        const processedNewLinks = processParallelLinks(newLinks);
        const updatedLinks = [...currentLinks, ...processedNewLinks];

        linkForce.links(updatedLinks);
      }

      // 3. Gentle Reheat (NebulaGraph: don't shake violently)
      sim.alpha(0.3).restart();

      setNodes(updatedNodes);
      setLinks(
        sim.force<d3.ForceLink<NetworkNode, NetworkLink>>("link")?.links() || []
      );
    },
    [width, height, links]
  );

  // Interaction handlers
  const dragStarted = useCallback((e: any, d: NetworkNode) => {
    if (!e.active) simulationRef.current?.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }, []);

  const dragged = useCallback((e: any, d: NetworkNode) => {
    d.fx = e.x;
    d.fy = e.y;
  }, []);

  const dragEnded = useCallback((e: any, d: NetworkNode) => {
    if (!e.active) simulationRef.current?.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }, []);

  return { nodes, links, addNode, dragStarted, dragged, dragEnded };
}

// --- NebulaGraph Optimization 2: Edge Curvature Logic ---
function processParallelLinks(links: NetworkLink[]): NetworkLink[] {
  // Map to store counts of links between pairs
  // Key: "id1-id2" (sorted)
  const pairMap = new Map<string, NetworkLink[]>();

  links.forEach((link) => {
    const sourceId =
      typeof link.source === "object"
        ? (link.source as NetworkNode).id
        : link.source;
    const targetId =
      typeof link.target === "object"
        ? (link.target as NetworkNode).id
        : link.target;

    // Ensure consistent key regardless of direction
    const key =
      sourceId < targetId
        ? `${sourceId}-${targetId}`
        : `${targetId}-${sourceId}`;

    if (!pairMap.has(key)) {
      pairMap.set(key, []);
    }
    pairMap.get(key)!.push(link);
  });

  // Assign linkNum based on index in the group
  // 0: straight, >0: curve one way, <0: curve other way
  // Or simpler: alternating numbers 1, -1, 2, -2... and 0 for center
  pairMap.forEach((group) => {
    const len = group.length;
    // Basic logic: center around 0
    // If odd: 0, 1, -1...
    // If even: 1, -1, 2, -2... (no straight line)
    // Or just spread them out?

    // Let's implement NebulaGraph style:
    // positive/negative based on direction?
    // "We need to judge the direction of the edge." -> compare source.name and target.name

    // Let's keep it simple for now: simple alternation centered on 0
    let mid = (len - 1) / 2;
    group.forEach((link, i) => {
      link.linkNum = i - mid;
      // e.g. length 1: i=0, mid=0 -> 0 (straight)
      // length 2: i=0, mid=0.5 -> -0.5; i=1 -> 0.5 (slight curves both ways)
      // length 3: i=0 -> -1; i=1 -> 0; i=2 -> 1
    });
  });

  return links;
}

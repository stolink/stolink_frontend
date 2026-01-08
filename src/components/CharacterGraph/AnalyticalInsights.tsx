import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Flame, Info } from "lucide-react";
import type { CharacterNode, RelationshipLink } from "@/types";

interface AnalyticalInsightsProps {
  nodes: CharacterNode[];
  links: RelationshipLink[];
  showTension: boolean;
  showLogicCheck: boolean;
  onNodeClick: (nodeId: string) => void;
}

export function AnalyticalInsights({
  nodes,
  links,
  showTension,
  showLogicCheck,
  onNodeClick,
}: AnalyticalInsightsProps) {
  // 1. Tension Heatmap Logic
  // Find clusters/nodes with high density of negative relationships
  const tensionClusters = useMemo(() => {
    if (!showTension) return [];

    const nodeScores = new Map<string, number>();

    links.forEach((link) => {
      // Check if negative relation
      const isNegative =
        link.type === "hostile" ||
        link.type === "rival" ||
        link.type === "enemy";
      if (!isNegative) return;

      const score = (link.strength || 1) * 2; // Higher strength = more tension
      const sId =
        typeof link.source === "object"
          ? (link.source as CharacterNode).id
          : (link.source as string);
      const tId =
        typeof link.target === "object"
          ? (link.target as CharacterNode).id
          : (link.target as string);

      nodeScores.set(sId, (nodeScores.get(sId) || 0) + score);
      nodeScores.set(tId, (nodeScores.get(tId) || 0) + score);
    });

    // Return top 3 high tension nodes
    return Array.from(nodeScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, score]) => {
        const node = nodes.find((n) => n.id === id);
        return { id, name: node?.name, score };
      });
  }, [nodes, links, showTension]);

  // 2. Logic Check Logic
  // Detect potential inconsistencies: e.g., "Friend of Enemy is Friend?" (Triadic Closure Paradox)
  // Simplified: Find A-B (Friendly), B-C (Hostile), A-C (Friendly) -> "Conflict of Loyalty"
  const logicIssues = useMemo(() => {
    if (!showLogicCheck) return [];

    const issues: { message: string; nodes: string[] }[] = [];
    const adj = new Map<string, Array<{ target: string; type: string }>>();

    // Build Adj List
    links.forEach((link) => {
      const sId =
        typeof link.source === "object"
          ? (link.source as CharacterNode).id
          : (link.source as string);
      const tId =
        typeof link.target === "object"
          ? (link.target as CharacterNode).id
          : (link.target as string);
      const type = link.type as string; // simplified

      if (!adj.has(sId)) adj.set(sId, []);
      if (!adj.has(tId)) adj.set(tId, []);

      adj.get(sId)?.push({ target: tId, type });
      adj.get(tId)?.push({ target: sId, type });
    });

    // Check Triads (Start from A)
    nodes.slice(0, 20).forEach((nodeA) => {
      // Limit check for perf
      const neighbors = adj.get(nodeA.id);
      if (!neighbors) return;

      neighbors.forEach((n1) => {
        // B
        neighbors.forEach((n2) => {
          // C
          if (n1.target === n2.target) return;

          // Check if B and C are connected
          const bcLink = links.find((l) => {
            const s =
              typeof l.source === "object"
                ? (l.source as CharacterNode).id
                : (l.source as string);
            const t =
              typeof l.target === "object"
                ? (l.target as CharacterNode).id
                : (l.target as string);
            return (
              (s === n1.target && t === n2.target) ||
              (s === n2.target && t === n1.target)
            );
          });

          if (bcLink) {
            // Analysis
            const ab = n1.type;
            const ac = n2.type;
            const bc = bcLink.type as string;

            // Pattern: Friend-Enemy-Friend (A friends with B, A friends with C, but B-C are enemies)
            if (
              (ab === "friendly" || ab === "ally") &&
              (ac === "friendly" || ac === "ally") &&
              (bc === "hostile" || bc === "enemy" || bc === "rival")
            ) {
              // Check duplicate
              const key = [nodeA.id, n1.target, n2.target].sort().join("-");
              if (!issues.some((i) => i.nodes.sort().join("-") === key)) {
                issues.push({
                  message: `Conflict of Loyalty: ${nodeA.name} is friends with both ${nodes.find((n) => n.id === n1.target)?.name} and ${nodes.find((n) => n.id === n2.target)?.name}, but they are enemies.`,
                  nodes: [nodeA.id, n1.target, n2.target],
                });
              }
            }
          }
        });
      });
    });

    return issues.slice(0, 3); // Limit to 3 issues
  }, [nodes, links, showLogicCheck]);

  if (!showTension && !showLogicCheck) return null;

  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col gap-3 w-80 pointer-events-none">
      <AnimatePresence>
        {showTension && tensionClusters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-black/80 backdrop-blur text-white p-3 rounded-xl border border-red-500/30 shadow-2xl pointer-events-auto"
          >
            <div className="flex items-center gap-2 mb-2 text-red-400 font-bold text-xs uppercase tracking-wider">
              <Flame className="w-4 h-4" />
              Tension Heatmap
            </div>
            <div className="space-y-2">
              {tensionClusters.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-sm bg-white/5 p-2 rounded hover:bg-white/10 cursor-pointer transition"
                  onClick={() => onNodeClick(c.id)}
                >
                  <span>{c.name || "Unknown"}</span>
                  <span className="text-red-400 font-mono text-xs">
                    Score: {c.score}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {showLogicCheck && logicIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white/90 backdrop-blur text-espresso-800 p-3 rounded-xl border border-amber-400 shadow-xl pointer-events-auto"
          >
            <div className="flex items-center gap-2 mb-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              Logic Check
            </div>
            <div className="space-y-2">
              {logicIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="text-xs bg-amber-50 p-2 rounded border border-amber-100 cursor-pointer hover:bg-amber-100 transition"
                  onClick={() => onNodeClick(issue.nodes[0])}
                >
                  {issue.message}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {showLogicCheck && logicIssues.length === 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white/90 backdrop-blur text-espresso-600 p-3 rounded-xl border border-green-400 shadow-xl"
          >
            <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4" />
              No conflicts found
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

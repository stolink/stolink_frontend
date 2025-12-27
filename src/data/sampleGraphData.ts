import type { NetworkNode, NetworkLink } from "@/types/network";

const NODES: NetworkNode[] = [
  // Group 1: Protagonists
  { id: "n1", name: "Alice", group: 1, strength: 10 },
  { id: "n2", name: "Bob", group: 1, strength: 8 },
  { id: "n3", name: "Charlie", group: 1, strength: 5 },

  // Group 2: Antagonists
  { id: "n4", name: "Dr. Evil", group: 2, strength: 10 },
  { id: "n5", name: "Minion 1", group: 2, strength: 3 },
  { id: "n6", name: "Minion 2", group: 2, strength: 3 },

  // Group 3: Neutrals/Connectors
  { id: "n7", name: "Oracle", group: 3, strength: 7 },
  { id: "n8", name: "Merchant", group: 3, strength: 4 },
  { id: "n9", name: "Guard", group: 3, strength: 6 },

  // Extra nodes for complexity
  { id: "n10", name: "Village Elder", group: 1, strength: 6 },
  { id: "n11", name: "Spy", group: 2, strength: 5 },
  { id: "n12", name: "Wanderer", group: 3, strength: 4 },
  { id: "n13", name: "Dog", group: 1, strength: 2 },
  { id: "n14", name: "Cat", group: 1, strength: 2 },
  { id: "n15", name: "Raven", group: 2, strength: 2 },

  // Isolated-ish cluster
  { id: "n16", name: "Ghost A", group: 4, strength: 4 },
  { id: "n17", name: "Ghost B", group: 4, strength: 4 },
  { id: "n18", name: "Ghost C", group: 4, strength: 4 },
];

const LINKS: NetworkLink[] = [
  // Multiple links between Alice and Bob (Testing curves)
  { source: "n1", target: "n2", value: 5 }, // Friends
  { source: "n2", target: "n1", value: 2 }, // But Bob owes Alice money? (Directional test)
  { source: "n1", target: "n2", value: 1 }, // Another connection

  // Triangle
  { source: "n2", target: "n3", value: 3 },
  { source: "n3", target: "n1", value: 4 },

  // Antagonist cluster
  { source: "n4", target: "n5", value: 8 },
  { source: "n4", target: "n6", value: 8 },
  { source: "n5", target: "n6", value: 3 },

  // Conflict (Group 1 vs Group 2)
  { source: "n1", target: "n4", value: 1 }, // Alice vs Dr. Evil
  { source: "n2", target: "n5", value: 1 }, // Bob vs Minion

  // Neutrals connecting groups
  { source: "n7", target: "n1", value: 2 },
  { source: "n7", target: "n4", value: 2 }, // Oracle talks to both

  // More connections
  { source: "n8", target: "n3", value: 3 }, // Merchant sells to Charlie
  { source: "n8", target: "n12", value: 2 },
  { source: "n9", target: "n4", value: 1 }, // Guard suspects Evil

  // Village cluster
  { source: "n10", target: "n1", value: 6 },
  { source: "n10", target: "n2", value: 4 },
  { source: "n13", target: "n1", value: 3 }, // Dog loves Alice
  { source: "n14", target: "n3", value: 3 }, // Cat loves Charlie

  // Spy
  { source: "n11", target: "n4", value: 5 },
  { source: "n11", target: "n8", value: 2 }, // Spy visits merchant

  // Bird
  { source: "n15", target: "n4", value: 2 },

  // Ghost Cluster (weakly connected to world)
  { source: "n16", target: "n17", value: 5 },
  { source: "n17", target: "n18", value: 5 },
  { source: "n18", target: "n16", value: 5 },
  { source: "n7", target: "n16", value: 1 }, // Oracle senses Ghost
];

export const SAMPLE_GRAPH_DATA = {
  nodes: NODES,
  links: LINKS,
};

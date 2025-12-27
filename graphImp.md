````markdown
# D3.js Force Graph Enhancement Prompt

## Current Problem Analysis

The current D3 force graph implementation lacks visual polish and has interaction bugs:

1. **Visual Issues**:
   - Node movements feel rigid, not fluid/organic like Obsidian's graph
   - Force feedback between nodes is not smooth
   - Overall aesthetic doesn't create "wow" factor

2. **Functional Bug**:
   - When selecting a character, ALL connected nodes get highlighted recursively
   - Should only highlight DIRECT connections (1-degree separation)
   - Current behavior is overwhelming and confusing

## Target Reference

Obsidian's graph view: smooth, wave-like node movements where dragging one node creates rippling physics effects across connected nodes. Nodes gently float and settle. Strong visual hierarchy with clear focus states.

---

## Required Improvements

### 1. Physics Simulation Tuning

```typescript
// Create buttery-smooth, organic movement
const simulation = d3
  .forceSimulation<CharacterNode>(nodes)
  .force(
    "link",
    d3
      .forceLink<CharacterNode, RelationshipLink>(links)
      .id((d) => d.id)
      .distance(150)
      .strength(0.3), // Softer springs = more fluid movement
  )
  .force(
    "charge",
    d3.forceManyBody().strength(-400).distanceMin(50).distanceMax(500),
  )
  .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05))
  .force(
    "collision",
    d3
      .forceCollide()
      .radius((d) => getRadius(d) + 20)
      .strength(0.7),
  )
  .force("x", d3.forceX(width / 2).strength(0.02)) // Gentle centering
  .force("y", d3.forceY(height / 2).strength(0.02))
  .alphaDecay(0.01) // Slower decay = longer, smoother settling
  .velocityDecay(0.3); // Lower friction = more fluid motion
```
````

### 2. Visual Enhancements

#### Node Styling

```typescript
// Gradient fills for depth
const nodeGradient = svg
  .append("defs")
  .selectAll("radialGradient")
  .data(nodes)
  .enter()
  .append("radialGradient")
  .attr("id", (d) => `gradient-${d.id}`)
  .attr("cx", "30%")
  .attr("cy", "30%");

nodeGradient
  .append("stop")
  .attr("offset", "0%")
  .attr("stop-color", (d) => d3.color(getColor(d)).brighter(0.5));

nodeGradient
  .append("stop")
  .attr("offset", "100%")
  .attr("stop-color", (d) => getColor(d));

// Subtle glow effect
const nodeGlow = svg
  .append("defs")
  .append("filter")
  .attr("id", "glow")
  .attr("x", "-50%")
  .attr("y", "-50%")
  .attr("width", "200%")
  .attr("height", "200%");

nodeGlow
  .append("feGaussianBlur")
  .attr("stdDeviation", "3")
  .attr("result", "coloredBlur");
```

#### Link Styling

```typescript
// Animated gradient for links showing relationship direction/flow
// Curved links using d3.line with curveBasis
const linkPath = d3.line().curve(d3.curveBasis);

// Variable opacity based on relationship strength
link.style("opacity", (d) => 0.3 + (d.strength / 10) * 0.5);
```

### 3. Interaction Fix: Direct Connections Only

```typescript
// WRONG: Recursive highlighting
const getConnectedNodes = (nodeId: string): Set<string> => {
  // This recursively gets ALL connected nodes - DON'T DO THIS
};

// CORRECT: Only direct (1-degree) connections
const getDirectConnections = (
  nodeId: string,
  links: RelationshipLink[],
): Set<string> => {
  const directlyConnected = new Set<string>();
  directlyConnected.add(nodeId);

  links.forEach((link) => {
    const sourceId =
      typeof link.source === "object" ? link.source.id : link.source;
    const targetId =
      typeof link.target === "object" ? link.target.id : link.target;

    if (sourceId === nodeId) {
      directlyConnected.add(targetId);
    }
    if (targetId === nodeId) {
      directlyConnected.add(sourceId);
    }
  });

  return directlyConnected;
};

// Apply highlight state
const handleNodeHover = (hoveredNode: CharacterNode | null) => {
  if (!hoveredNode) {
    // Reset all nodes/links to default state
    nodes.style("opacity", 1);
    links.style("opacity", 0.6);
    return;
  }

  const directConnections = getDirectConnections(hoveredNode.id, linksData);

  nodes.style("opacity", (d) => (directConnections.has(d.id) ? 1 : 0.15));
  links.style("opacity", (d) => {
    const sourceId = typeof d.source === "object" ? d.source.id : d.source;
    const targetId = typeof d.target === "object" ? d.target.id : d.target;
    return sourceId === hoveredNode.id || targetId === hoveredNode.id
      ? 1
      : 0.05;
  });
};
```

### 4. WOW Point Features

#### A. Particle Flow on Links (Relationship Intensity)

```typescript
// Animated particles flowing along links
// Shows direction and strength of relationships
const animateParticles = () => {
  links.each(function (d) {
    if (d.strength > 5) {
      // Add flowing particle effect for strong relationships
    }
  });
};
```

#### B. Node Pulse Animation

```typescript
// Subtle breathing animation for nodes
nodes
  .append('circle')
  .attr('class', 'pulse-ring')
  .attr('r', d => getRadius(d))
  .style('animation', 'pulse 3s ease-in-out infinite');

// CSS
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.1); opacity: 0.1; }
}
```

#### C. Magnetic Cursor Effect

```typescript
// Nodes slightly attract/repel from cursor position
svg.on("mousemove", (event) => {
  const [mx, my] = d3.pointer(event);
  simulation.force("cursor", d3.forceRadial(100, mx, my).strength(-0.03));
  simulation.alpha(0.1).restart();
});

svg.on("mouseleave", () => {
  simulation.force("cursor", null);
});
```

#### D. Depth of Field Effect

```typescript
// Nodes further from center/focus are slightly blurred
const applyDepthOfField = (focusNode: CharacterNode | null) => {
  nodes.style("filter", (d) => {
    if (!focusNode) return "none";
    const distance = getDistance(d, focusNode);
    const blur = Math.min(distance / 200, 3);
    return `blur(${blur}px)`;
  });
};
```

#### E. Entry Animation

```typescript
// Nodes explode from center and settle into place
const initialPositions = nodes.map((n) => ({
  ...n,
  x: width / 2,
  y: height / 2,
}));

simulation.nodes(initialPositions);
simulation.alpha(1).restart();

// Staggered fade-in
nodes
  .style("opacity", 0)
  .transition()
  .delay((d, i) => i * 50)
  .duration(500)
  .style("opacity", 1);
```

### 5. Performance Optimization

```typescript
// Use requestAnimationFrame for smooth 60fps
let frameId: number;
simulation.on("tick", () => {
  cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(render);
});

// Stop simulation when settled
simulation.on("end", () => {
  cancelAnimationFrame(frameId);
});

// Cleanup on unmount
useEffect(() => {
  return () => {
    simulation.stop();
    cancelAnimationFrame(frameId);
  };
}, []);
```

### 6. Visual Hierarchy

```typescript
// Z-index layering
// 1. Link shadows (lowest)
// 2. Links
// 3. Node shadows
// 4. Nodes
// 5. Labels
// 6. Hover effects (highest)

const g = svg.append("g");
const linkShadowLayer = g.append("g").attr("class", "link-shadows");
const linkLayer = g.append("g").attr("class", "links");
const nodeShadowLayer = g.append("g").attr("class", "node-shadows");
const nodeLayer = g.append("g").attr("class", "nodes");
const labelLayer = g.append("g").attr("class", "labels");
```

---

## Acceptance Criteria

1. **Fluid Motion**: Dragging a node creates smooth, wave-like ripples through connected nodes
2. **Organic Settling**: Nodes gently float and settle, never abrupt stops
3. **Clear Focus**: Clicking/hovering a node highlights ONLY direct connections
4. **Visual Polish**: Gradients, glows, subtle animations create premium feel
5. **Performance**: Maintains 60fps with up to 200 nodes
6. **Readability**: Labels and relationships remain clear at all zoom levels

## References to Research

- D3 force simulation best practices
- Obsidian graph view implementation patterns
- Force-directed graph UX patterns
- SVG animation performance optimization

```

```

````markdown
# 2.5D Character Relationship Graph Implementation Prompt

## Overview

Build a 2.5D character relationship visualization using Three.js (react-three-fiber) combined with D3 force simulation. The graph renders on a tilted plane with depth, shadows, and lighting to create a premium, immersive feel while maintaining 2D readability and usability.

## Tech Stack

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing d3-force gsap
npm install -D @types/three @types/d3-force
```
````

- **react-three-fiber**: Three.js React bindings
- **@react-three/drei**: Utility components (Text, OrbitControls, etc.)
- **@react-three/postprocessing**: Bloom, outline, depth-of-field effects
- **d3-force**: Physics simulation only (not rendering)
- **gsap**: Smooth animations

## Data Structures

```typescript
interface CharacterNode {
  id: string;
  name: string;
  group?: string; // Faction/group for color coding
  imageUrl?: string;
  importance?: number; // 1-10, affects node size and elevation

  // D3 force adds these at runtime
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface RelationshipLink {
  source: string | CharacterNode;
  target: string | CharacterNode;
  type: "family" | "friend" | "enemy" | "lover" | "master" | "rival";
  strength?: number; // 1-10, affects line thickness and glow
  label?: string;
}

interface GraphData {
  nodes: CharacterNode[];
  links: RelationshipLink[];
}
```

## Component Architecture

```
components/
  CharacterGraph25D/
    index.tsx                 # Main component with Canvas
    Scene.tsx                 # Three.js scene setup
    Nodes.tsx                 # Node meshes with hover/click
    Links.tsx                 # Edge rendering with glow
    Floor.tsx                 # Shadow-receiving plane
    Lighting.tsx              # Ambient + point lights
    Effects.tsx               # Post-processing (bloom, etc.)
    Labels.tsx                # Billboard text labels
    useForceSimulation.ts     # D3 force hook
    useNodeInteraction.ts     # Raycaster hover/click
    constants.ts              # Colors, sizes
    types.ts                  # TypeScript definitions
```

## Scene Setup

```tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

const CharacterGraph25D: React.FC<GraphProps> = ({ data, onNodeClick }) => {
  return (
    <Canvas
      shadows
      camera={{
        position: [0, 400, 600],
        fov: 60,
        near: 0.1,
        far: 2000,
      }}
    >
      {/* Dark background */}
      <color attach="background" args={["#0a0a0f"]} />

      {/* Fog for depth */}
      <fog attach="fog" args={["#0a0a0f", 500, 1500]} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight
        position={[200, 500, 300]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Main content */}
      <GraphContent data={data} onNodeClick={onNodeClick} />

      {/* Shadow-receiving floor */}
      <Floor />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.5}
        />
      </EffectComposer>

      {/* Limited orbit controls - mainly for subtle tilt adjustment */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2.5}
        minPolarAngle={Math.PI / 4}
        maxDistance={1200}
        minDistance={300}
      />
    </Canvas>
  );
};
```

## D3 Force Simulation Hook

```typescript
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3-force";

export const useForceSimulation = (
  initialNodes: CharacterNode[],
  initialLinks: RelationshipLink[],
) => {
  const [nodes, setNodes] = useState<CharacterNode[]>(initialNodes);
  const [links, setLinks] = useState<RelationshipLink[]>(initialLinks);
  const simulationRef =
    useRef<d3.Simulation<CharacterNode, RelationshipLink>>();

  useEffect(() => {
    const simulation = d3
      .forceSimulation<CharacterNode>(initialNodes)
      .force(
        "link",
        d3
          .forceLink<CharacterNode, RelationshipLink>(initialLinks)
          .id((d) => d.id)
          .distance(150)
          .strength(0.3),
      )
      .force(
        "charge",
        d3.forceManyBody().strength(-400).distanceMin(50).distanceMax(500),
      )
      .force("center", d3.forceCenter(0, 0).strength(0.05))
      .force(
        "collision",
        d3
          .forceCollide<CharacterNode>()
          .radius((d) => 20 + (d.importance || 5) * 3)
          .strength(0.7),
      )
      .force("x", d3.forceX(0).strength(0.02))
      .force("y", d3.forceY(0).strength(0.02))
      .alphaDecay(0.01)
      .velocityDecay(0.3);

    simulation.on("tick", () => {
      setNodes([...simulation.nodes()]);
      setLinks([...initialLinks]);
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [initialNodes, initialLinks]);

  const reheat = () => {
    simulationRef.current?.alpha(0.3).restart();
  };

  const dragNode = (nodeId: string, x: number, z: number) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node && simulationRef.current) {
      node.fx = x;
      node.fy = z; // D3 y maps to Three.js z
      simulationRef.current.alpha(0.1).restart();
    }
  };

  const releaseNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      node.fx = null;
      node.fy = null;
    }
  };

  return { nodes, links, reheat, dragNode, releaseNode };
};
```

## Node Component

```tsx
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

interface NodeMeshProps {
  node: CharacterNode;
  isHighlighted: boolean;
  isDimmed: boolean;
  onHover: (node: CharacterNode | null) => void;
  onClick: (node: CharacterNode) => void;
}

const NodeMesh: React.FC<NodeMeshProps> = ({
  node,
  isHighlighted,
  isDimmed,
  onHover,
  onClick,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const baseRadius = 10 + (node.importance || 5) * 3;
  const baseY = (node.importance || 5) * 5;

  // Smooth hover animation
  useEffect(() => {
    if (!meshRef.current) return;

    gsap.to(meshRef.current.position, {
      y: hovered ? baseY + 30 : baseY,
      duration: 0.3,
      ease: "power2.out",
    });

    gsap.to(meshRef.current.scale, {
      x: hovered ? 1.2 : 1,
      y: hovered ? 1.2 : 1,
      z: hovered ? 1.2 : 1,
      duration: 0.3,
      ease: "power2.out",
    });
  }, [hovered, baseY]);

  // Subtle floating animation
  useFrame(({ clock }) => {
    if (meshRef.current && !hovered) {
      meshRef.current.position.y =
        baseY + Math.sin(clock.elapsedTime + node.id.charCodeAt(0)) * 2;
    }
  });

  return (
    <group position={[node.x || 0, 0, node.y || 0]}>
      {/* Main sphere */}
      <mesh
        ref={meshRef}
        position={[0, baseY, 0]}
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(node);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
          document.body.style.cursor = "default";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(node);
        }}
      >
        <sphereGeometry args={[baseRadius, 32, 32]} />
        <meshStandardMaterial
          color={getGroupColor(node.group)}
          metalness={0.3}
          roughness={0.7}
          emissive={getGroupColor(node.group)}
          emissiveIntensity={isHighlighted ? 0.3 : hovered ? 0.2 : 0}
          transparent
          opacity={isDimmed ? 0.2 : 1}
        />
      </mesh>

      {/* Glow ring on hover */}
      {hovered && (
        <mesh position={[0, baseY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseRadius + 5, baseRadius + 8, 32]} />
          <meshBasicMaterial
            color={getGroupColor(node.group)}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Label */}
      <Billboard position={[0, baseY + baseRadius + 15, 0]}>
        <Text
          fontSize={12}
          color={isDimmed ? "#444444" : "#ffffff"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.5}
          outlineColor="#000000"
        >
          {node.name}
        </Text>
      </Billboard>
    </group>
  );
};
```

## Link Component with Glow

```tsx
import { useMemo } from "react";
import * as THREE from "three";

interface LinkMeshProps {
  link: RelationshipLink;
  sourcePos: THREE.Vector3;
  targetPos: THREE.Vector3;
  isHighlighted: boolean;
  isDimmed: boolean;
}

const LinkMesh: React.FC<LinkMeshProps> = ({
  link,
  sourcePos,
  targetPos,
  isHighlighted,
  isDimmed,
}) => {
  const color = getLinkColor(link.type);
  const thickness = 1 + (link.strength || 5) * 0.3;

  // Create curved path
  const curve = useMemo(() => {
    const midPoint = new THREE.Vector3()
      .addVectors(sourcePos, targetPos)
      .multiplyScalar(0.5);
    midPoint.y += 20; // Arc upward

    return new THREE.QuadraticBezierCurve3(sourcePos, midPoint, targetPos);
  }, [sourcePos, targetPos]);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 20, thickness, 8, false);
  }, [curve, thickness]);

  const glowGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 20, thickness * 2, 8, false);
  }, [curve, thickness]);

  return (
    <group>
      {/* Inner solid line */}
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isDimmed ? 0.05 : isHighlighted ? 1 : 0.6}
        />
      </mesh>

      {/* Outer glow */}
      <mesh geometry={glowGeometry}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isDimmed ? 0.02 : isHighlighted ? 0.3 : 0.1}
        />
      </mesh>
    </group>
  );
};
```

## Floor Component

```tsx
const Floor: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -50, 0]} receiveShadow>
      <planeGeometry args={[2000, 2000]} />
      <shadowMaterial transparent opacity={0.3} />
    </mesh>
  );
};
```

## Interaction: Direct Connections Only

```typescript
// CRITICAL: Only highlight 1-degree connections, not recursive

const getDirectConnections = (
  nodeId: string,
  links: RelationshipLink[]
): Set<string> => {
  const connected = new Set<string>();
  connected.add(nodeId);

  links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;

    if (sourceId === nodeId) connected.add(targetId);
    if (targetId === nodeId) connected.add(sourceId);
  });

  return connected;
};

const getDirectLinks = (
  nodeId: string,
  links: RelationshipLink[]
): Set<string> => {
  const directLinks = new Set<string>();

  links.forEach((link, index) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;

    if (sourceId === nodeId || targetId === nodeId) {
      directLinks.add(`${sourceId}-${targetId}`);
    }
  });

  return directLinks;
};

// Usage in component
const [hoveredNode, setHoveredNode] = useState<CharacterNode | null>(null);
const [selectedNode, setSelectedNode] = useState<CharacterNode | null>(null);

const focusNode = selectedNode || hoveredNode;
const highlightedNodes = focusNode
  ? getDirectConnections(focusNode.id, links)
  : null;
const highlightedLinks = focusNode
  ? getDirectLinks(focusNode.id, links)
  : null;

// In render
{nodes.map(node => (
  <NodeMesh
    key={node.id}
    node={node}
    isHighlighted={highlightedNodes?.has(node.id) ?? false}
    isDimmed={highlightedNodes !== null && !highlightedNodes.has(node.id)}
    onHover={setHoveredNode}
    onClick={setSelectedNode}
  />
))}
```

## Visual Effects Summary

| Effect                       | Implementation                | Impact |
| ---------------------------- | ----------------------------- | ------ |
| Node elevation by importance | `position.y = importance * 5` | ⭐⭐⭐ |
| Hover float up               | GSAP `position.y += 30`       | ⭐⭐⭐ |
| Subtle idle bobbing          | `sin(time) * 2` in useFrame   | ⭐⭐   |
| Node glow on hover           | Emissive material + ring      | ⭐⭐⭐ |
| Cast shadows on floor        | `castShadow` + ShadowMaterial | ⭐⭐⭐ |
| Link glow tubes              | Double TubeGeometry           | ⭐⭐   |
| Curved links                 | QuadraticBezierCurve3         | ⭐⭐   |
| Bloom post-processing        | EffectComposer + Bloom        | ⭐⭐⭐ |
| Fog depth                    | scene.fog                     | ⭐⭐   |
| Dim non-connected nodes      | opacity transition            | ⭐⭐⭐ |

## Color Constants

```typescript
// Node colors by group
const GROUP_COLORS: Record<string, string> = {
  protagonist: "#4A90D9",
  antagonist: "#D0021B",
  supporting: "#7ED321",
  neutral: "#9B9B9B",
  default: "#F5A623",
};

// Link colors by relationship type
const LINK_COLORS: Record<string, string> = {
  family: "#4A90D9",
  friend: "#7ED321",
  enemy: "#D0021B",
  lover: "#FF6B9D",
  master: "#9B9B9B",
  rival: "#F5A623",
};

const getGroupColor = (group?: string): string => {
  return GROUP_COLORS[group || "default"] || GROUP_COLORS.default;
};

const getLinkColor = (type: string): string => {
  return LINK_COLORS[type] || "#666666";
};
```

## Props Interface

```typescript
interface CharacterGraph25DProps {
  data: GraphData;
  width?: number | string;
  height?: number | string;
  onNodeClick?: (node: CharacterNode) => void;
  onNodeHover?: (node: CharacterNode | null) => void;
  selectedNodeId?: string | null;
  className?: string;
}
```

## Acceptance Criteria

1. **2.5D Perspective**: Graph renders on tilted plane with proper depth perception
2. **Smooth Physics**: D3 force creates fluid, organic node movement
3. **Shadows**: Nodes cast soft shadows on floor plane
4. **Hover Effects**: Nodes float up, scale, and glow on hover
5. **Direct Connections Only**: Highlighting shows only 1-degree connections
6. **Dim Non-Related**: Unconnected nodes fade to ~20% opacity
7. **Curved Glowing Links**: Edges arc upward with glow effect
8. **Labels**: Billboard text stays readable at all angles
9. **Bloom**: Subtle bloom on emissive elements
10. **Performance**: 60fps with 100+ nodes

```

```

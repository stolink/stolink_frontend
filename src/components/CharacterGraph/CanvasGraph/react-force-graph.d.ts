/* Type definitions for react-force-graph-2d */
declare module "react-force-graph-2d" {
  import { FC, MutableRefObject } from "react";

  export interface NodeObject {
    id: string | number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
    [key: string]: unknown;
  }

  export interface LinkObject {
    source: string | number | NodeObject;
    target: string | number | NodeObject;
    [key: string]: unknown;
  }

  export interface GraphData {
    nodes: NodeObject[];
    links: LinkObject[];
  }

  export interface ForceGraphMethods {
    centerAt: (x: number, y: number, ms?: number) => void;
    zoom: (k: number, ms?: number) => void;
    zoomToFit: (ms?: number, padding?: number) => void;
    pauseAnimation: () => void;
    resumeAnimation: () => void;
    d3Force: (forceName: string, force?: unknown) => unknown;
    d3ReheatSimulation: () => void;
    onZoom?: (
      callback: (transform: { x: number; y: number; k: number }) => void,
    ) => void;
  }

  export interface ForceGraph2DProps {
    ref?: MutableRefObject<ForceGraphMethods | undefined>;
    graphData?: GraphData;
    width?: number;
    height?: number;
    backgroundColor?: string;

    // Force simulation
    d3AlphaDecay?: number;
    d3VelocityDecay?: number;
    d3Force?: string;
    warmupTicks?: number;
    cooldownTicks?: number;
    cooldownTime?: number;

    // Zoom & Pan
    minZoom?: number;
    maxZoom?: number;
    enableZoomInteraction?: boolean;
    enablePanInteraction?: boolean;

    // Node rendering
    nodeCanvasObject?: (
      node: NodeObject,
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => void;
    nodeCanvasObjectMode?: () => "replace" | "before" | "after";
    nodePointerAreaPaint?: (
      node: NodeObject,
      color: string,
      ctx: CanvasRenderingContext2D,
    ) => void;

    // Link rendering
    linkCanvasObject?: (
      link: LinkObject,
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => void;
    linkCanvasObjectMode?: () => "replace" | "before" | "after";
    linkDirectionalParticles?: number;

    // Interaction
    onNodeClick?: (node: NodeObject, event?: MouseEvent) => void;
    onNodeHover?: (
      node: NodeObject | null,
      prevNode?: NodeObject | null,
    ) => void;
    onNodeDrag?: (
      node: NodeObject,
      translate: { x: number; y: number },
    ) => void;
    onNodeDragEnd?: (
      node: NodeObject,
      translate: { x: number; y: number },
    ) => void;
    onLinkClick?: (link: LinkObject, event?: MouseEvent) => void;
    onLinkHover?: (
      link: LinkObject | null,
      prevLink?: LinkObject | null,
    ) => void;
    enableNodeDrag?: boolean;
    enablePointerInteraction?: boolean;

    // Other
    onEngineStop?: () => void;
    onEngineTick?: () => void;
    onZoom?: (transform: { x: number; y: number; k: number }) => void;
    pixelRatio?: number;
    nodeId?: string;
    linkSource?: string;
    linkTarget?: string;
    linkPointerAreaPaint?: (
      link: LinkObject,
      color: string,
      ctx: CanvasRenderingContext2D,
    ) => void;
  }

  const ForceGraph2D: FC<ForceGraph2DProps>;
  export default ForceGraph2D;
}

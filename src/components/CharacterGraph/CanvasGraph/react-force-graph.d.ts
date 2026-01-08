/**
 * react-force-graph-2d 타입 정의
 * 공식 타입 선언이 없어 직접 정의
 */
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
    [key: string]: any;
  }

  export interface LinkObject {
    source: string | number | NodeObject;
    target: string | number | NodeObject;
    [key: string]: any;
  }

  export interface GraphData {
    nodes: NodeObject[];
    links: LinkObject[];
  }

  export interface ForceGraph2DProps {
    ref?: MutableRefObject<any>;
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
      node: any,
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => void;
    nodeCanvasObjectMode?: () => "replace" | "before" | "after";
    nodePointerAreaPaint?: (
      node: any,
      color: string,
      ctx: CanvasRenderingContext2D,
    ) => void;

    // Link rendering
    linkCanvasObject?: (
      link: any,
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => void;
    linkCanvasObjectMode?: () => "replace" | "before" | "after";
    linkDirectionalParticles?: number;

    // Interaction
    onNodeClick?: (node: any, event?: MouseEvent) => void;
    onNodeHover?: (node: any | null, prevNode?: any | null) => void;
    onNodeDrag?: (node: any, translate: { x: number; y: number }) => void;
    onNodeDragEnd?: (
      node: any,
      translate: { x: number; y: number },
    ) => void;
    onLinkClick?: (link: any, event?: MouseEvent) => void;
    onLinkHover?: (link: any | null, prevLink?: any | null) => void;
    enableNodeDrag?: boolean;
    enablePointerInteraction?: boolean;

    // Other
    onEngineStop?: () => void;
    onEngineTick?: () => void;
  }

  const ForceGraph2D: FC<ForceGraph2DProps>;
  export default ForceGraph2D;
}

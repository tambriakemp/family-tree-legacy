import { useMemo } from "react";
import type { TreeMember } from "@/types/database";

interface NodePosition {
  member: TreeMember;
  x: number;
  y: number;
}

interface Connection {
  id: string;
  type: "parent-child" | "spouse";
  path: string;
}

interface TreeMinimapProps {
  nodePositions: NodePosition[];
  connections: Connection[];
  svgWidth: number;
  svgHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  pan: { x: number; y: number };
  zoom: number;
  onNavigate: (pan: { x: number; y: number }) => void;
}

const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 120;
const NODE_WIDTH = 160;
const NODE_HEIGHT = 80;

export function TreeMinimap({
  nodePositions,
  connections,
  svgWidth,
  svgHeight,
  viewportWidth,
  viewportHeight,
  pan,
  zoom,
  onNavigate,
}: TreeMinimapProps) {
  const scale = useMemo(() => {
    const scaleX = MINIMAP_WIDTH / svgWidth;
    const scaleY = MINIMAP_HEIGHT / svgHeight;
    return Math.min(scaleX, scaleY, 1);
  }, [svgWidth, svgHeight]);

  // Calculate viewport rectangle in minimap coordinates
  const viewport = useMemo(() => {
    const scaledViewportWidth = (viewportWidth / zoom) * scale;
    const scaledViewportHeight = (viewportHeight / zoom) * scale;
    
    // Calculate offset based on pan position
    const offsetX = (-pan.x / zoom) * scale;
    const offsetY = (-pan.y / zoom) * scale;

    return {
      x: Math.max(0, offsetX),
      y: Math.max(0, offsetY),
      width: Math.min(scaledViewportWidth, MINIMAP_WIDTH - offsetX),
      height: Math.min(scaledViewportHeight, MINIMAP_HEIGHT - offsetY),
    };
  }, [viewportWidth, viewportHeight, pan, zoom, scale]);

  const handleMinimapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click position to tree coordinates
    const treeX = clickX / scale;
    const treeY = clickY / scale;

    // Calculate new pan to center viewport on click position
    const newPanX = -(treeX - viewportWidth / (2 * zoom)) * zoom;
    const newPanY = -(treeY - viewportHeight / (2 * zoom)) * zoom;

    onNavigate({ x: newPanX, y: newPanY });
  };

  if (nodePositions.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-10 bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-lg p-2">
      <div className="text-xs text-muted-foreground mb-1 px-1">Overview</div>
      <svg
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        className="cursor-pointer rounded"
        onClick={handleMinimapClick}
        style={{ background: "hsl(var(--muted) / 0.3)" }}
      >
        {/* Scaled connections */}
        <g transform={`scale(${scale})`}>
          {connections.map((conn) => (
            <path
              key={conn.id}
              d={conn.path}
              className="stroke-primary/30"
              strokeWidth={2 / scale}
              fill="none"
            />
          ))}

          {/* Scaled nodes */}
          {nodePositions.map(({ member, x, y }) => (
            <rect
              key={member.id}
              x={x}
              y={y}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={8}
              className="fill-primary/60"
            />
          ))}
        </g>

        {/* Viewport indicator */}
        <rect
          x={viewport.x}
          y={viewport.y}
          width={Math.max(viewport.width, 20)}
          height={Math.max(viewport.height, 20)}
          className="fill-primary/10 stroke-primary"
          strokeWidth={2}
          rx={4}
        />
      </svg>
    </div>
  );
}

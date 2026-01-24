interface Connection {
  id: string;
  type: "parent-child" | "spouse";
  path: string;
  byMarriage?: boolean;
}

interface TreeConnectionsProps {
  connections: Connection[];
}

export function TreeConnections({ connections }: TreeConnectionsProps) {
  return (
    <g className="tree-connections">
      {/* Define arrow marker */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="8"
          refX="8"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,8 L10,4 z"
            className="fill-primary/60"
          />
        </marker>
        <marker
          id="arrowhead-muted"
          markerWidth="8"
          markerHeight="6"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L8,3 z"
            className="fill-muted-foreground/40"
          />
        </marker>
      </defs>

      {connections.map((conn) => (
        <g key={conn.id}>
          {conn.type === "parent-child" ? (
            <ParentChildConnection path={conn.path} />
          ) : (
            <SpouseConnection path={conn.path} byMarriage={conn.byMarriage} />
          )}
        </g>
      ))}
    </g>
  );
}

function ParentChildConnection({ path }: { path: string }) {
  // Parse the path to get the endpoint for the arrow
  // Path format: M{x1} {y1} L{x1} {midY} L{x2} {midY} L{x2} {y2}
  const segments = path.split(" L");
  
  // Get the last segment endpoint for arrow positioning
  const lastSegment = segments[segments.length - 1];
  const match = lastSegment?.match(/([\d.]+) ([\d.]+)/);
  
  if (!match) {
    return (
      <path
        d={path}
        className="tree-connector stroke-primary/50"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  const endX = parseFloat(match[1]);
  const endY = parseFloat(match[2]);
  
  // Create a shorter path that ends before the arrow
  const arrowOffset = 12;
  const modifiedPath = path.replace(
    new RegExp(`L${endX} ${endY}$`),
    `L${endX} ${endY - arrowOffset}`
  );

  return (
    <g className="parent-child-connection">
      {/* Main connecting line */}
      <path
        d={modifiedPath}
        className="tree-connector stroke-primary/50"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow pointing down to child */}
      <polygon
        points={`${endX},${endY} ${endX - 6},${endY - 12} ${endX + 6},${endY - 12}`}
        className="fill-primary/60"
      />
    </g>
  );
}

function SpouseConnection({ path, byMarriage }: { path: string; byMarriage?: boolean }) {
  // Parse path to find midpoint for heart icon
  // Path format: M{x1} {y} L{x2} {y}
  const match = path.match(/M([\d.]+) ([\d.]+) L([\d.]+)/);
  
  if (!match) {
    return (
      <path
        d={path}
        className="tree-connector stroke-accent/60"
        strokeWidth={2}
        strokeDasharray="6,4"
        fill="none"
        strokeLinecap="round"
      />
    );
  }

  const x1 = parseFloat(match[1]);
  const x2 = parseFloat(match[3]);
  const y = parseFloat(match[2]);
  const midX = (x1 + x2) / 2;
  
  // Gap for the heart icon
  const heartGap = 16;

  return (
    <g className="spouse-connection">
      {/* Left side of connection */}
      <path
        d={`M${x1} ${y} L${midX - heartGap} ${y}`}
        className="tree-connector stroke-accent/60"
        strokeWidth={2}
        strokeDasharray="6,4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Right side of connection */}
      <path
        d={`M${midX + heartGap} ${y} L${x2} ${y}`}
        className="tree-connector stroke-accent/60"
        strokeWidth={2}
        strokeDasharray="6,4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Heart icon in the middle */}
      <g transform={`translate(${midX - 10}, ${y - 10})`}>
        <path
          d="M10 4C8.5 1.5 5 1 3 3C1 5 1 8 3 10L10 17L17 10C19 8 19 5 17 3C15 1 11.5 1.5 10 4Z"
          className={byMarriage ? "fill-primary/40 stroke-primary/70" : "fill-accent/30 stroke-accent/60"}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {/* "By marriage" label */}
      {byMarriage && (
        <text
          x={midX}
          y={y + 18}
          textAnchor="middle"
          className="text-[9px] fill-muted-foreground font-medium"
        >
          by marriage
        </text>
      )}
    </g>
  );
}
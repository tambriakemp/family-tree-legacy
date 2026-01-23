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
      {connections.map((conn) => (
        <g key={conn.id}>
          <path
            d={conn.path}
            className="tree-connector"
            strokeWidth={conn.type === "spouse" ? 2 : 2.5}
            strokeDasharray={conn.type === "spouse" ? "6,4" : undefined}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {conn.byMarriage && conn.type === "spouse" && (
            <HeartIcon path={conn.path} />
          )}
        </g>
      ))}
    </g>
  );
}

function HeartIcon({ path }: { path: string }) {
  // Parse path to find midpoint
  const match = path.match(/M([\d.]+) ([\d.]+) L([\d.]+)/);
  if (!match) return null;
  
  const x1 = parseFloat(match[1]);
  const x2 = parseFloat(match[3]);
  const y = parseFloat(match[2]);
  const midX = (x1 + x2) / 2;

  return (
    <g transform={`translate(${midX - 6}, ${y - 14})`}>
      <path
        d="M6 2C3.5 0 0 1.5 0 4.5C0 7.5 6 11 6 11C6 11 12 7.5 12 4.5C12 1.5 8.5 0 6 2Z"
        className="fill-primary/30 stroke-primary/60"
        strokeWidth={1}
      />
    </g>
  );
}

import { User } from "lucide-react";
import type { TreeMember } from "@/types/database";

interface PersonNodeProps {
  person: TreeMember;
  x: number;
  y: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function PersonNode({ person, x, y, isSelected, onClick }: PersonNodeProps) {
  const truncate = (s: string, max: number) => s.length > max ? s.slice(0, max) + "..." : s;
  
  const birthYear = person.birth_date ? new Date(person.birth_date).getFullYear() : null;
  const deathYear = person.death_date ? new Date(person.death_date).getFullYear() : null;
  
  const dateRange = birthYear
    ? deathYear
      ? `${birthYear} - ${deathYear}`
      : `${birthYear} - present`
    : null;

  return (
    <g
      className="cursor-pointer hover:opacity-90 transition-opacity"
      onClick={onClick}
    >
      <rect
        x={x}
        y={y}
        width={160}
        height={96}
        rx={16}
        className={`fill-card stroke-2 shadow-lg ${
          isSelected ? "stroke-primary" : "stroke-primary/50"
        }`}
      />
      
      {/* Avatar circle */}
      {person.profile_photo_url ? (
        <clipPath id={`avatar-clip-${person.id}`}>
          <circle cx={x + 35} cy={y + 48} r={20} />
        </clipPath>
      ) : null}
      
      {person.profile_photo_url ? (
        <image
          href={person.profile_photo_url}
          x={x + 15}
          y={y + 28}
          width={40}
          height={40}
          clipPath={`url(#avatar-clip-${person.id})`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <circle cx={x + 35} cy={y + 48} r={20} className="fill-sage-light" />
      )}
      
      {!person.profile_photo_url && (
        <foreignObject x={x + 23} y={y + 28} width={24} height={24}>
          <User className="w-6 h-6 text-primary/60" />
        </foreignObject>
      )}
      
      {/* Name */}
      <text
        x={x + 65}
        y={y + 35}
        className="fill-foreground text-sm font-medium"
        style={{ fontSize: "13px" }}
      >
        {fullName.length > 14 ? fullName.slice(0, 14) + "..." : fullName}
      </text>
      
      {/* Date range */}
      {dateRange && (
        <text
          x={x + 65}
          y={y + 52}
          className="fill-muted-foreground text-xs"
          style={{ fontSize: "11px" }}
        >
          {dateRange}
        </text>
      )}
    </g>
  );
}

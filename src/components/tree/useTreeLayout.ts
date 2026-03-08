import { useMemo } from "react";
import type { TreeMember, Relationship } from "@/types/database";

interface NodePosition {
  member: TreeMember;
  x: number;
  y: number;
}

interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalGap: number;
  verticalGap: number;
  spouseGap: number;
}

const DEFAULT_CONFIG: LayoutConfig = {
  nodeWidth: 160,
  nodeHeight: 80,
  horizontalGap: 60,
  verticalGap: 100,
  spouseGap: 20,
};

interface FamilyUnit {
  primary: TreeMember;
  spouse?: TreeMember;
  children: TreeMember[];
}

export function useTreeLayout(
  members: TreeMember[],
  relationships: Relationship[],
  config: Partial<LayoutConfig> = {}
) {
  const layoutConfig = { ...DEFAULT_CONFIG, ...config };

  return useMemo(() => {
    if (members.length === 0) {
      return { nodePositions: [], svgWidth: 800, svgHeight: 500, connections: [] };
    }

    const { nodeWidth, nodeHeight, horizontalGap, verticalGap, spouseGap } = layoutConfig;

    // Build relationship maps
    const parentChildMap = new Map<string, string[]>(); // parent -> children
    const childParentMap = new Map<string, string[]>(); // child -> parents
    const spouseMap = new Map<string, string>(); // person -> spouse

    relationships.forEach((rel) => {
      if (rel.relationship_type === "parent") {
        // from_person is parent of to_person
        const children = parentChildMap.get(rel.from_person_id) || [];
        children.push(rel.to_person_id);
        parentChildMap.set(rel.from_person_id, children);

        const parents = childParentMap.get(rel.to_person_id) || [];
        parents.push(rel.from_person_id);
        childParentMap.set(rel.to_person_id, parents);
    } else if (rel.relationship_type === "spouse" || rel.relationship_type === "partner") {
        spouseMap.set(rel.from_person_id, rel.to_person_id);
        spouseMap.set(rel.to_person_id, rel.from_person_id);
      }
    });

    // Find root nodes (people without parents in the tree)
    const roots = members.filter((m) => {
      const parents = childParentMap.get(m.id) || [];
      return parents.length === 0;
    });

    // Group roots into family units (couples)
    const processedIds = new Set<string>();
    const familyUnits: FamilyUnit[] = [];

    roots.forEach((root) => {
      if (processedIds.has(root.id)) return;

      const spouseId = spouseMap.get(root.id);
      const spouse = spouseId ? members.find((m) => m.id === spouseId) : undefined;

      // Get children of this family unit
      const primaryChildren = parentChildMap.get(root.id) || [];
      const spouseChildren = spouse ? parentChildMap.get(spouse.id) || [] : [];
      const allChildrenIds = [...new Set([...primaryChildren, ...spouseChildren])];
      const children = allChildrenIds
        .map((id) => members.find((m) => m.id === id))
        .filter((m): m is TreeMember => m !== undefined);

      processedIds.add(root.id);
      if (spouse) processedIds.add(spouse.id);

      familyUnits.push({ primary: root, spouse, children });
    });

    // Handle orphaned members (no relationships at all)
    members.forEach((m) => {
      if (!processedIds.has(m.id)) {
        familyUnits.push({ primary: m, children: [] });
        processedIds.add(m.id);
      }
    });

    // Calculate positions using a recursive approach
    const positions: NodePosition[] = [];
    const memberPositions = new Map<string, { x: number; y: number }>();

    // Calculate subtree width for a family unit
    const getSubtreeWidth = (unit: FamilyUnit, visited: Set<string> = new Set()): number => {
      const unitWidth = unit.spouse
        ? nodeWidth * 2 + spouseGap
        : nodeWidth;

      if (unit.children.length === 0) return unitWidth;

      let childrenWidth = 0;
      unit.children.forEach((child, idx) => {
        if (visited.has(child.id)) return;
        visited.add(child.id);

        const childSpouseId = spouseMap.get(child.id);
        const childSpouse = childSpouseId ? members.find((m) => m.id === childSpouseId) : undefined;
        const grandchildren = [...new Set([
          ...(parentChildMap.get(child.id) || []),
          ...(childSpouse ? parentChildMap.get(childSpouse.id) || [] : []),
        ])]
          .map((id) => members.find((m) => m.id === id))
          .filter((m): m is TreeMember => m !== undefined);

        if (childSpouse) visited.add(childSpouse.id);

        const childUnit: FamilyUnit = { primary: child, spouse: childSpouse, children: grandchildren };
        childrenWidth += getSubtreeWidth(childUnit, visited);
        if (idx < unit.children.length - 1) childrenWidth += horizontalGap;
      });

      return Math.max(unitWidth, childrenWidth);
    };

    // Position a family unit and its descendants
    const positionUnit = (
      unit: FamilyUnit,
      centerX: number,
      y: number,
      visited: Set<string> = new Set()
    ) => {
      const unitWidth = unit.spouse ? nodeWidth * 2 + spouseGap : nodeWidth;

      // Position primary member
      const primaryX = centerX - unitWidth / 2;
      positions.push({ member: unit.primary, x: primaryX, y });
      memberPositions.set(unit.primary.id, { x: primaryX, y });
      visited.add(unit.primary.id);

      // Position spouse
      if (unit.spouse && !memberPositions.has(unit.spouse.id)) {
        const spouseX = primaryX + nodeWidth + spouseGap;
        positions.push({ member: unit.spouse, x: spouseX, y });
        memberPositions.set(unit.spouse.id, { x: spouseX, y });
        visited.add(unit.spouse.id);
      }

      // Position children
      if (unit.children.length > 0) {
        const childY = y + nodeHeight + verticalGap;

        // Calculate total children width
        const childUnits: FamilyUnit[] = [];
        const childWidths: number[] = [];

        unit.children.forEach((child) => {
          if (visited.has(child.id)) return;

          const childSpouseId = spouseMap.get(child.id);
          const childSpouse = childSpouseId ? members.find((m) => m.id === childSpouseId) : undefined;
          const grandchildren = [...new Set([
            ...(parentChildMap.get(child.id) || []),
            ...(childSpouse ? parentChildMap.get(childSpouse.id) || [] : []),
          ])]
            .map((id) => members.find((m) => m.id === id))
            .filter((m): m is TreeMember => m !== undefined);

          const childUnit: FamilyUnit = { primary: child, spouse: childSpouse, children: grandchildren };
          childUnits.push(childUnit);
          childWidths.push(getSubtreeWidth(childUnit, new Set(visited)));
        });

        const totalChildrenWidth = childWidths.reduce((sum, w) => sum + w, 0) +
          (childWidths.length - 1) * horizontalGap;

        let currentX = centerX - totalChildrenWidth / 2;

        childUnits.forEach((childUnit, idx) => {
          const childCenterX = currentX + childWidths[idx] / 2;
          positionUnit(childUnit, childCenterX, childY, visited);
          currentX += childWidths[idx] + horizontalGap;
        });
      }
    };

    // Position all family units
    let totalWidth = 0;
    const unitWidths = familyUnits.map((unit) => getSubtreeWidth(unit));
    totalWidth = unitWidths.reduce((sum, w) => sum + w, 0) +
      (unitWidths.length - 1) * horizontalGap * 2;

    const startX = Math.max(100, 50);
    let currentX = startX + unitWidths[0] / 2;
    const globalVisited = new Set<string>();

    familyUnits.forEach((unit, idx) => {
      if (globalVisited.has(unit.primary.id)) return;
      positionUnit(unit, currentX, 50, globalVisited);
      if (idx < familyUnits.length - 1) {
        currentX += unitWidths[idx] / 2 + horizontalGap * 2 + unitWidths[idx + 1] / 2;
      }
    });

    // Calculate SVG dimensions
    const maxX = Math.max(...positions.map((p) => p.x + nodeWidth), 800);
    const maxY = Math.max(...positions.map((p) => p.y + nodeHeight), 500);

    // Generate connection paths
    const connections: {
      id: string;
      type: "parent-child" | "spouse";
      path: string;
      byMarriage?: boolean;
    }[] = [];

    relationships.forEach((rel) => {
      const fromPos = memberPositions.get(rel.from_person_id);
      const toPos = memberPositions.get(rel.to_person_id);
      if (!fromPos || !toPos) return;

      if (rel.relationship_type === "spouse" || rel.relationship_type === "partner") {
        // Horizontal spouse connection
        const y = fromPos.y + nodeHeight / 2;
        const x1 = Math.min(fromPos.x, toPos.x) + nodeWidth;
        const x2 = Math.max(fromPos.x, toPos.x);

        connections.push({
          id: rel.id,
          type: "spouse",
          path: `M${x1} ${y} L${x2} ${y}`,
          byMarriage: rel.by_marriage,
        });
      } else if (rel.relationship_type === "parent") {
        // Vertical parent-child connection
        const parentX = fromPos.x + nodeWidth / 2;
        const parentY = fromPos.y + nodeHeight;
        const childX = toPos.x + nodeWidth / 2;
        const childY = toPos.y;
        const midY = (parentY + childY) / 2;

        connections.push({
          id: rel.id,
          type: "parent-child",
          path: `M${parentX} ${parentY} L${parentX} ${midY} L${childX} ${midY} L${childX} ${childY}`,
        });
      }
    });

    return {
      nodePositions: positions,
      svgWidth: maxX + 100,
      svgHeight: maxY + 100,
      connections,
    };
  }, [members, relationships, layoutConfig]);
}

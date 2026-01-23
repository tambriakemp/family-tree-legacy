import { useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, ZoomIn, ZoomOut, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFamilyTree } from "@/hooks/useFamilyTrees";
import { useTreeMembers } from "@/hooks/useTreeMembers";
import { useRelationships } from "@/hooks/useRelationships";
import { PersonNode } from "@/components/tree/PersonNode";
import { PersonFormDialog } from "@/components/tree/PersonFormDialog";
import { RelationshipFormDialog } from "@/components/tree/RelationshipFormDialog";
import { PersonDetailDrawer } from "@/components/tree/PersonDetailDrawer";
import type { TreeMember, RelationshipType, CreateTreeMemberInput, UpdateTreeMemberInput } from "@/types/database";

const TreeView = () => {
  const { treeId } = useParams<{ treeId: string }>();
  const { data: tree, isLoading: treeLoading } = useFamilyTree(treeId);
  const { members, isLoading: membersLoading, createMember, updateMember, deleteMember } = useTreeMembers(treeId);
  const { relationships, createRelationship } = useRelationships(treeId);

  const [zoom, setZoom] = useState(1);
  const [selectedPerson, setSelectedPerson] = useState<TreeMember | null>(null);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);
  const [showPersonDetail, setShowPersonDetail] = useState(false);
  const [editingPerson, setEditingPerson] = useState<TreeMember | null>(null);
  const [defaultRelationType, setDefaultRelationType] = useState<RelationshipType>("parent");

  const isLoading = treeLoading || membersLoading;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));

  const handleAddPerson = () => {
    setEditingPerson(null);
    setShowPersonForm(true);
  };

  const handleEditPerson = () => {
    setEditingPerson(selectedPerson);
    setShowPersonForm(true);
  };

  const handlePersonClick = (person: TreeMember) => {
    setSelectedPerson(person);
    setShowPersonDetail(true);
  };

  const handlePersonFormSubmit = async (data: CreateTreeMemberInput | (UpdateTreeMemberInput & { id: string })) => {
    if ("id" in data) {
      await updateMember.mutateAsync(data);
    } else {
      await createMember.mutateAsync(data);
    }
    setShowPersonForm(false);
    setEditingPerson(null);
  };

  const handleDeletePerson = async () => {
    if (selectedPerson) {
      await deleteMember.mutateAsync(selectedPerson.id);
      setShowPersonDetail(false);
      setSelectedPerson(null);
    }
  };

  const handleAddRelationship = (type: RelationshipType) => {
    setDefaultRelationType(type);
    setShowRelationshipForm(true);
  };

  const handleRelationshipSubmit = async (data: Parameters<typeof createRelationship.mutateAsync>[0]) => {
    await createRelationship.mutateAsync(data);
    setShowRelationshipForm(false);
  };

  // Calculate positions for tree visualization
  const calculateNodePositions = useCallback(() => {
    if (members.length === 0) return [];
    
    const nodeWidth = 160;
    const nodeHeight = 80;
    const horizontalGap = 40;
    const verticalGap = 60;
    
    const nodesPerRow = Math.ceil(Math.sqrt(members.length));
    
    return members.map((member, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;
      const rowMemberCount = Math.min(nodesPerRow, members.length - row * nodesPerRow);
      const rowWidth = rowMemberCount * nodeWidth + (rowMemberCount - 1) * horizontalGap;
      const startX = (800 - rowWidth) / 2;
      
      return {
        member,
        x: startX + col * (nodeWidth + horizontalGap),
        y: 50 + row * (nodeHeight + verticalGap),
      };
    });
  }, [members]);

  const nodePositions = calculateNodePositions();

  // Calculate SVG viewBox height based on content
  const svgHeight = Math.max(500, nodePositions.length > 0 
    ? Math.max(...nodePositions.map(n => n.y)) + 130 
    : 500);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-heavy border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="font-display text-lg font-semibold">
              {tree?.title || "Family Tree"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Invite
            </Button>
            <Button variant="default" size="sm" onClick={handleAddPerson}>
              <Plus className="w-4 h-4 mr-2" />
              Add Person
            </Button>
          </div>
        </div>
      </header>

      {/* Tree Canvas */}
      <main className="pt-16 h-screen overflow-hidden">
        <div className="relative w-full h-full bg-gradient-hero overflow-auto">
          {/* Zoom controls */}
          <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-10">
            <Button
              variant="outline"
              size="icon"
              className="bg-card shadow-soft"
              onClick={handleZoomIn}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-card shadow-soft"
              onClick={handleZoomOut}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Tree Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full min-h-full flex items-start justify-center p-8"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
          >
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-20 h-20 rounded-full bg-sage-light flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-xl font-display font-semibold mb-2">
                  Start Your Family Tree
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Add the first person to your family tree to get started.
                  You can add yourself or any family member.
                </p>
                <Button onClick={handleAddPerson}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Person
                </Button>
              </div>
            ) : (
              <svg
                className="w-full max-w-4xl"
                viewBox={`0 0 800 ${svgHeight}`}
                preserveAspectRatio="xMidYMin meet"
              >
                {/* Relationship lines */}
                {relationships.map((rel) => {
                  const fromNode = nodePositions.find(
                    (n) => n.member.id === rel.from_person_id
                  );
                  const toNode = nodePositions.find(
                    (n) => n.member.id === rel.to_person_id
                  );
                  if (!fromNode || !toNode) return null;

                  const fromX = fromNode.x + 80;
                  const fromY = fromNode.y + 80;
                  const toX = toNode.x + 80;
                  const toY = toNode.y;

                  const isSpouse = rel.relationship_type === "spouse" || rel.relationship_type === "partner";

                  return (
                    <g key={rel.id}>
                      <path
                        d={
                          isSpouse
                            ? `M${fromNode.x + 160} ${fromNode.y + 40} L${toNode.x} ${toNode.y + 40}`
                            : `M${fromX} ${fromY} L${fromX} ${(fromY + toY) / 2} L${toX} ${(fromY + toY) / 2} L${toX} ${toY}`
                        }
                        className="tree-connector"
                        strokeWidth={isSpouse ? 2 : 3}
                        strokeDasharray={isSpouse ? "5,5" : undefined}
                        fill="none"
                      />
                      {rel.by_marriage && isSpouse && (
                        <text
                          x={(fromNode.x + 160 + toNode.x) / 2}
                          y={fromNode.y + 32}
                          className="fill-muted-foreground text-[10px]"
                          textAnchor="middle"
                        >
                          by marriage
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Person nodes */}
                {nodePositions.map(({ member, x, y }) => (
                  <PersonNode
                    key={member.id}
                    person={member}
                    x={x}
                    y={y}
                    isSelected={selectedPerson?.id === member.id}
                    onClick={() => handlePersonClick(member)}
                  />
                ))}
              </svg>
            )}
          </motion.div>
        </div>
      </main>

      {/* Dialogs */}
      <PersonFormDialog
        open={showPersonForm}
        onOpenChange={setShowPersonForm}
        treeId={treeId || ""}
        person={editingPerson}
        onSubmit={handlePersonFormSubmit}
        isLoading={createMember.isPending || updateMember.isPending}
      />

      <RelationshipFormDialog
        open={showRelationshipForm}
        onOpenChange={setShowRelationshipForm}
        treeId={treeId || ""}
        fromPerson={selectedPerson}
        members={members}
        onSubmit={handleRelationshipSubmit}
        isLoading={createRelationship.isPending}
        existingRelationships={relationships}
      />

      <PersonDetailDrawer
        open={showPersonDetail}
        onOpenChange={setShowPersonDetail}
        person={selectedPerson}
        relationships={relationships}
        members={members}
        onEdit={handleEditPerson}
        onDelete={handleDeletePerson}
        onAddRelationship={handleAddRelationship}
        isDeleting={deleteMember.isPending}
      />
    </div>
  );
};

export default TreeView;

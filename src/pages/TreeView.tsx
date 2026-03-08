import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, ZoomIn, ZoomOut, Users, UserPlus, Loader2, Calendar, Image, RotateCcw, Search, X, Download, TreeDeciduous, Upload } from "lucide-react";
import { ProjectSettingsDialog } from "@/components/tree/ProjectSettingsDialog";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useFamilyTree, useFamilyTrees } from "@/hooks/useFamilyTrees";
import { useTreeMembers } from "@/hooks/useTreeMembers";
import { useRelationships } from "@/hooks/useRelationships";
import { useCollaborators } from "@/hooks/useCollaborators";
import { useAuth } from "@/hooks/useAuth";
import { PersonNode } from "@/components/tree/PersonNode";
import { PersonFormDialog } from "@/components/tree/PersonFormDialog";
import { RelationshipFormDialog } from "@/components/tree/RelationshipFormDialog";
import { PersonDetailDrawer } from "@/components/tree/PersonDetailDrawer";
import { InviteCollaboratorDialog } from "@/components/collaborators/InviteCollaboratorDialog";
import { CollaboratorList } from "@/components/collaborators/CollaboratorList";
import { GedcomImportDialog } from "@/components/tree/GedcomImportDialog";
import { TreeConnections } from "@/components/tree/TreeConnections";
import { TreeMinimap } from "@/components/tree/TreeMinimap";
import { useTreeLayout } from "@/components/tree/useTreeLayout";
import { useTreePan } from "@/components/tree/useTreePan";
import type { TreeMember, RelationshipType, CreateTreeMemberInput, UpdateTreeMemberInput, CollaboratorRole } from "@/types/database";

const TreeView = () => {
  const { treeId } = useParams<{ treeId: string }>();
  const { data: tree, isLoading: treeLoading } = useFamilyTree(treeId);
  const { members, isLoading: membersLoading, createMember, updateMember, deleteMember } = useTreeMembers(treeId);
  const { relationships, createRelationship, deleteRelationship, updateRelationship } = useRelationships(treeId);
  const { collaborators, sendInvite, updateCollaboratorRole, removeCollaborator, resendInvite } = useCollaborators(treeId);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isOwner = tree?.owner_user_id === user?.id;

  const [zoom, setZoom] = useState(1);
  const [selectedPerson, setSelectedPerson] = useState<TreeMember | null>(null);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);
  const [showPersonDetail, setShowPersonDetail] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCollaboratorList, setShowCollaboratorList] = useState(false);
  const [editingPerson, setEditingPerson] = useState<TreeMember | null>(null);
  const [defaultRelationType, setDefaultRelationType] = useState<RelationshipType>("parent");
  const [relationshipDescriptionText, setRelationshipDescriptionText] = useState<string | undefined>();
  const [siblingMode, setSiblingMode] = useState(false);
  const [siblingParentIds, setSiblingParentIds] = useState<string[]>([]);
  const [lockedRelationType, setLockedRelationType] = useState<RelationshipType | undefined>();
  const [isChildMode, setIsChildMode] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGedcomImport, setShowGedcomImport] = useState(false);
  const { toast } = useToast();

  // Onboarding tooltip after first person added
  useEffect(() => {
    if (members.length === 1 && !localStorage.getItem("familyflow-onboarding-dismissed")) {
      setShowOnboarding(true);
    } else if (members.length > 1) {
      setShowOnboarding(false);
    }
  }, [members.length]);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("familyflow-onboarding-dismissed", "true");
  };

  // Use hierarchical tree layout
  const { nodePositions, svgWidth, svgHeight, connections } = useTreeLayout(
    members,
    relationships
  );

  // Pan/drag functionality
  const {
    pan,
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleWheel,
    setPan,
    resetPan,
  } = useTreePan(zoom, svgWidth, svgHeight);

  // Track viewport size for minimap
  useEffect(() => {
    const updateViewportSize = () => {
      if (canvasRef.current) {
        setViewportSize({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        });
      }
    };
    
    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  const isLoading = treeLoading || membersLoading;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleResetView = () => {
    setZoom(1);
    resetPan();
  };

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
    setLockedRelationType(type);
    setIsChildMode(false);
    if (type === "parent" && selectedPerson) {
      setRelationshipDescriptionText(`Who is the parent of ${selectedPerson.first_name}${selectedPerson.last_name ? ' ' + selectedPerson.last_name : ''}?`);
    } else if (type === "spouse" && selectedPerson) {
      setRelationshipDescriptionText(`Who is the spouse of ${selectedPerson.first_name}${selectedPerson.last_name ? ' ' + selectedPerson.last_name : ''}?`);
    } else {
      setRelationshipDescriptionText(undefined);
    }
    setSiblingMode(false);
    setShowRelationshipForm(true);
  };

  const handleAddChild = () => {
    setDefaultRelationType("parent");
    setLockedRelationType("parent");
    setIsChildMode(true);
    setRelationshipDescriptionText(`Who is the child of ${selectedPerson?.first_name}${selectedPerson?.last_name ? ' ' + selectedPerson.last_name : ''}?`);
    setSiblingMode(false);
    setShowRelationshipForm(true);
  };

  const handleAddSibling = () => {
    if (!selectedPerson) return;

    // Find this person's existing parents (relationships where type=parent and to_person_id=selectedPerson)
    const parentIds = relationships
      .filter(r => r.relationship_type === "parent" && r.to_person_id === selectedPerson.id)
      .map(r => r.from_person_id);

    if (parentIds.length === 0) {
      toast({
        title: "No parents found",
        description: "Add a parent to this person first, then siblings will be automatically inferred from shared parents.",
      });
      return;
    }

    // Get the first parent's name for the description
    const firstParent = members.find(m => m.id === parentIds[0]);
    const parentName = firstParent
      ? `${firstParent.first_name}${firstParent.last_name ? ' ' + firstParent.last_name : ''}`
      : "their parent";

    setDefaultRelationType("parent");
    setLockedRelationType("parent");
    setIsChildMode(false);
    setSiblingParentIds(parentIds);
    setRelationshipDescriptionText(`Select a person to become a sibling. They will share ${parentName}'s parentage.`);
    setSiblingMode(true);
    setShowRelationshipForm(true);
  };

  const handleRelationshipSubmit = async (data: Parameters<typeof createRelationship.mutateAsync>[0]) => {
    let finalData = { ...data };

    if (siblingMode && siblingParentIds.length > 0) {
      // In sibling mode: create parent→chosen person relationship for each shared parent
      for (const parentId of siblingParentIds) {
        await createRelationship.mutateAsync({
          ...data,
          from_person_id: parentId,
          to_person_id: data.to_person_id,
          relationship_type: "parent",
        });
      }
      setShowRelationshipForm(false);
      toast({ title: "Sibling added via shared parent!" });
      setSiblingMode(false);
      setSiblingParentIds([]);
      setRelationshipDescriptionText(undefined);
      setLockedRelationType(undefined);
      setIsChildMode(false);
      return;
    }

    // For Add Parent: flip direction so from_person_id = chosen person, to_person_id = current person
    if (lockedRelationType === "parent" && !isChildMode) {
      finalData = {
        ...data,
        from_person_id: data.to_person_id,
        to_person_id: data.from_person_id,
      };
    }

    await createRelationship.mutateAsync(finalData);
    setShowRelationshipForm(false);
    setRelationshipDescriptionText(undefined);
    setLockedRelationType(undefined);
    setIsChildMode(false);
    setSiblingParentIds([]);
  };

  const handleDeleteRelationship = async (id: string) => {
    await deleteRelationship.mutateAsync(id);
  };

  const handleUpdateRelationship = async (data: { 
    id: string; 
    relationship_type?: RelationshipType; 
    by_marriage?: boolean 
  }) => {
    await updateRelationship.mutateAsync(data);
  };

  const exportTree = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    const prevZoom = zoom;
    const prevPan = { ...pan };

    try {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(canvasRef.current);
      const link = document.createElement("a");
      link.download = `${tree?.title || "family-tree"}-family-tree.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({ title: "Family tree exported!" });
    } catch {
      toast({ title: "Export failed. Please try again.", variant: "destructive" });
    } finally {
      setZoom(prevZoom);
      setPan(prevPan);
      setIsExporting(false);
    }
  };

  const handleInviteSubmit = async (data: { email: string; role: CollaboratorRole }) => {
    if (!treeId) return;
    await sendInvite.mutateAsync({
      family_tree_id: treeId,
      email: data.email,
      role: data.role,
    });
  };

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
          <div className="relative max-w-48">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-8 text-sm rounded-full border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/trees/${treeId}/calendar`}>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <Link to={`/trees/${treeId}/gallery`}>
              <Button variant="outline" size="sm">
                <Image className="w-4 h-4 mr-2" />
                Photos
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowCollaboratorList(true)}
            >
              <Users className="w-4 h-4 mr-2" />
              Collaborators
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowInviteDialog(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportTree}
              disabled={isExporting || members.length === 0}
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {isExporting ? "Exporting..." : "Export"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGedcomImport(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import GEDCOM
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
        <div 
          ref={canvasRef}
          className={`relative w-full h-full bg-gradient-hero overflow-hidden ${
            isPanning ? "cursor-grabbing" : "cursor-grab"
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        >
          {/* Onboarding tooltip */}
          {showOnboarding && members.length === 1 && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-20 rounded-xl bg-card border border-primary/40 shadow-lg p-4 max-w-sm text-center">
              <TreeDeciduous className="w-6 h-6 text-primary mx-auto mb-2" />
              <h3 className="font-display font-semibold text-foreground mb-1">Great start!</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Now click on <span className="font-medium text-foreground">{members[0].first_name}</span> to add their parents, spouse, or children and grow your tree.
              </p>
              <Button size="sm" onClick={dismissOnboarding}>Got it!</Button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="fixed bottom-6 right-6 flex flex-col items-center gap-2 z-10">
            <Button
              variant="outline"
              size="icon"
              className="bg-card shadow-soft"
              onClick={handleZoomIn}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-card shadow-soft"
              onClick={handleZoomOut}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-card shadow-soft"
              onClick={handleResetView}
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>


          {/* Minimap Overview */}
          {members.length > 0 && (
            <TreeMinimap
              nodePositions={nodePositions}
              connections={connections}
              svgWidth={svgWidth}
              svgHeight={svgHeight}
              viewportWidth={viewportSize.width}
              viewportHeight={viewportSize.height}
              pan={pan}
              zoom={zoom}
              onNavigate={setPan}
            />
          )}

          {/* Tree Visualization */}
          <div
            className="w-full min-h-full flex items-start justify-center p-8 transition-opacity duration-300"
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
              transformOrigin: "top center",
              userSelect: isPanning ? "none" : "auto",
            }}
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
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              >
                {/* Relationship connections */}
                <TreeConnections connections={connections} />

                {/* Person nodes */}
                {nodePositions.map(({ member, x, y }) => {
                  const matches = searchQuery === "" || 
                    member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (member.last_name && member.last_name.toLowerCase().includes(searchQuery.toLowerCase()));
                  return (
                    <g
                      key={member.id}
                      opacity={searchQuery === "" ? 1 : matches ? 1 : 0.3}
                      transform={searchQuery !== "" && matches ? `translate(${x}, ${y}) scale(1.05) translate(${-x}, ${-y})` : undefined}
                      style={{ transformOrigin: `${x + 75}px ${y + 48}px` }}
                    >
                      <PersonNode
                        person={member}
                        x={x}
                        y={y}
                        isSelected={selectedPerson?.id === member.id}
                        onClick={() => handlePersonClick(member)}
                      />
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
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
        defaultRelationType={defaultRelationType}
        descriptionText={relationshipDescriptionText}
        lockedRelationType={lockedRelationType}
        isChildMode={isChildMode}
        siblingParentIds={siblingMode ? siblingParentIds : undefined}
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
        onAddChild={handleAddChild}
        onAddSibling={handleAddSibling}
        isDeleting={deleteMember.isPending}
        onDeleteRelationship={handleDeleteRelationship}
        isDeletingRelationship={deleteRelationship.isPending}
        onUpdateRelationship={handleUpdateRelationship}
        isUpdatingRelationship={updateRelationship.isPending}
        onCreateRelationship={async (data) => { await createRelationship.mutateAsync(data); }}
      />

      <InviteCollaboratorDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        treeId={treeId || ""}
        onSubmit={handleInviteSubmit}
        isLoading={sendInvite.isPending}
      />

      <CollaboratorList
        open={showCollaboratorList}
        onOpenChange={setShowCollaboratorList}
        collaborators={collaborators}
        onUpdateRole={(id, role) => updateCollaboratorRole.mutate({ id, role })}
        onRemove={(id) => removeCollaborator.mutate(id)}
        onResendInvite={(collaborator) => resendInvite.mutate(collaborator)}
        onInviteClick={() => {
          setShowCollaboratorList(false);
          setShowInviteDialog(true);
        }}
        isOwner={isOwner}
      />

      <GedcomImportDialog
        open={showGedcomImport}
        onOpenChange={setShowGedcomImport}
        treeId={treeId || ""}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["tree-members", treeId] });
          queryClient.invalidateQueries({ queryKey: ["relationships", treeId] });
        }}
      />
    </div>
  );
};

export default TreeView;

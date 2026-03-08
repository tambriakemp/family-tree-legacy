import { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, Edit, Trash2, Plus, Heart, Users, 
  Calendar, Image, FileText, ArrowUp, ArrowDown, Loader2, Send, History, Clock
} from "lucide-react";
import type { TreeMember, Relationship, RelationshipType, PhotoWithTags } from "@/types/database";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePersonNotes } from "@/hooks/usePersonNotes";
import { usePersonPhotos } from "@/hooks/usePhotos";

interface PersonDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: TreeMember | null;
  relationships: Relationship[];
  members: TreeMember[];
  onEdit: () => void;
  onDelete: () => void;
  onAddRelationship: (type: RelationshipType) => void;
  isDeleting?: boolean;
  onDeleteRelationship: (id: string) => void;
  isDeletingRelationship?: boolean;
  onUpdateRelationship: (data: { id: string; relationship_type?: RelationshipType; by_marriage?: boolean }) => void;
  isUpdatingRelationship?: boolean;
}

const getRelationshipLabel = (type: RelationshipType, relatedPerson: TreeMember | undefined, isFromPerson: boolean): string => {
  if (type === "parent") {
    if (isFromPerson) {
      // Viewed person is the parent, related person is the child
      if (relatedPerson?.gender === "male") return "Son";
      if (relatedPerson?.gender === "female") return "Daughter";
      return "Child";
    } else {
      // Viewed person is the child, related person is the parent
      if (relatedPerson?.gender === "male") return "Father";
      if (relatedPerson?.gender === "female") return "Mother";
      return "Parent";
    }
  }
  if (type === "spouse") {
    if (relatedPerson?.gender === "male") return "Husband";
    if (relatedPerson?.gender === "female") return "Wife";
    return "Spouse";
  }
  if (type === "partner") return "Partner";
  return type;
};

const relationshipLabels: Record<RelationshipType, string> = {
  parent: "Parent",
  spouse: "Spouse",
  partner: "Partner",
};

const relationshipTypes: { value: RelationshipType; label: string }[] = [
  { value: "parent", label: "Parent" },
  { value: "spouse", label: "Spouse" },
  { value: "partner", label: "Partner" },
];

export function PersonDetailDrawer({
  open,
  onOpenChange,
  person,
  relationships,
  members,
  onEdit,
  onDelete,
  onAddRelationship,
  isDeleting,
  onDeleteRelationship,
  isDeletingRelationship,
  onUpdateRelationship,
  isUpdatingRelationship,
}: PersonDetailDrawerProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteRelDialog, setShowDeleteRelDialog] = useState<string | null>(null);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [editRelType, setEditRelType] = useState<RelationshipType>("parent");
  const [editByMarriage, setEditByMarriage] = useState(false);
  const [newNote, setNewNote] = useState("");
  
  const { notes, isLoading: notesLoading, createNote, deleteNote } = usePersonNotes(person?.id);
  const { data: personPhotos, isLoading: photosLoading } = usePersonPhotos(person?.id, person?.family_tree_id);

  if (!person) return null;

  const fullName = `${person.first_name}${person.last_name ? ` ${person.last_name}` : ""}`;

  const getRelatedPerson = (personId: string) => {
    return members.find((m) => m.id === personId);
  };

  const personRelationships = relationships.filter(
    (r) => r.from_person_id === person.id || r.to_person_id === person.id
  );

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    onDelete();
  };

  const handleEditRelationship = (rel: Relationship) => {
    setEditingRelationship(rel);
    setEditRelType(rel.relationship_type);
    setEditByMarriage(rel.by_marriage || false);
  };

  const handleSaveRelationship = () => {
    if (!editingRelationship) return;
    onUpdateRelationship({
      id: editingRelationship.id,
      relationship_type: editRelType,
      by_marriage: editByMarriage,
    });
    setEditingRelationship(null);
  };


  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="text-left pb-4 border-b border-border">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-sage-light flex items-center justify-center flex-shrink-0">
                {person.profile_photo_url ? (
                  <img
                    src={person.profile_photo_url}
                    alt={fullName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary/60" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="font-display text-xl">{fullName}</SheetTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {person.birth_date ? (
                    <span>
                      {format(new Date(person.birth_date), "MMM d, yyyy")}
                      {person.death_date && (
                        <> – {format(new Date(person.death_date), "MMM d, yyyy")}</>
                      )}
                    </span>
                  ) : (
                    <span>No birth date set</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </SheetHeader>

          <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="relationships">Relations</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Quick Actions
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => onAddRelationship("parent")}
                  >
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Add Parent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => onAddRelationship("parent")}
                  >
                    <ArrowDown className="w-4 h-4 mr-2" />
                    Add Child
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => onAddRelationship("spouse")}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Add Spouse
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => {
                      toast.info("To add a sibling, add a shared parent to both people in the tree.");
                    }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Add Sibling
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Relationships ({personRelationships.length})
                </h4>
                {personRelationships.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No relationships defined yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {personRelationships.slice(0, 4).map((rel) => {
                      const relatedId =
                        rel.from_person_id === person.id
                          ? rel.to_person_id
                          : rel.from_person_id;
                      const related = getRelatedPerson(relatedId);
                      if (!related) return null;
                      
                      return (
                        <div
                          key={rel.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center">
                              <User className="w-4 h-4 text-primary/60" />
                            </div>
                            <span className="text-sm font-medium">
                              {related.first_name} {related.last_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {rel.by_marriage && (
                              <Badge variant="secondary" className="text-xs">
                                by marriage
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {getRelationshipLabel(rel.relationship_type, related)}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="relationships" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">All Relationships</h4>
                <Button size="sm" onClick={() => onAddRelationship("parent")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              {personRelationships.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No relationships yet. Add parents, children, or spouse.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {personRelationships.map((rel) => {
                    const relatedId =
                      rel.from_person_id === person.id
                        ? rel.to_person_id
                        : rel.from_person_id;
                    const related = getRelatedPerson(relatedId);
                    if (!related) return null;

                    return (
                      <div
                        key={rel.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-sage-light flex items-center justify-center">
                            <User className="w-5 h-5 text-primary/60" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {related.first_name} {related.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getRelationshipLabel(rel.relationship_type, related)}
                              {rel.by_marriage && " (by marriage)"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditRelationship(rel)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setShowDeleteRelDialog(rel.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-muted-foreground" />
                <h4 className="font-medium">Relationship History</h4>
              </div>
              {personRelationships.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No relationship history yet. Add relationships to track changes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {personRelationships
                    .sort((a, b) => {
                      const dateA = a.updated_at ? new Date(a.updated_at) : new Date(a.created_at);
                      const dateB = b.updated_at ? new Date(b.updated_at) : new Date(b.created_at);
                      return dateB.getTime() - dateA.getTime();
                    })
                    .map((rel) => {
                      const relatedId =
                        rel.from_person_id === person.id
                          ? rel.to_person_id
                          : rel.from_person_id;
                      const related = getRelatedPerson(relatedId);
                      if (!related) return null;

                      const wasModified = rel.updated_at && rel.updated_at !== rel.created_at;

                      return (
                        <div
                          key={rel.id}
                          className="p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {getRelationshipLabel(rel.relationship_type, related)}
                            </Badge>
                            {rel.by_marriage && (
                              <Badge variant="secondary" className="text-xs">
                                by marriage
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium mb-2">
                            {person.first_name} → {related.first_name} {related.last_name}
                          </p>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              <span>Created: {format(new Date(rel.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                            </div>
                            {wasModified && (
                              <div className="flex items-center gap-2">
                                <Edit className="w-3 h-3" />
                                <span>Modified: {format(new Date(rel.updated_at!), "MMM d, yyyy 'at' h:mm a")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder={`Add a note about ${person.first_name}...`}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    if (newNote.trim() && person) {
                      await createNote.mutateAsync({ person_id: person.id, content: newNote });
                      setNewNote("");
                    }
                  }}
                  disabled={!newNote.trim() || createNote.isPending}
                >
                  {createNote.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Add Note
                </Button>
                
                {notesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No notes yet. Add memories and stories about {person.first_name}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(note.created_at), "MMM d, yyyy")}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => deleteNote.mutateAsync(note.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="photos" className="mt-4">
              {photosLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : personPhotos && personPhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {personPhotos.map((photo) => (
                    <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={photo.url}
                        alt={photo.caption || "Photo"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Image className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No photos yet. Upload photos of {person.first_name} in the gallery and tag them.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this person and all their relationships
              from the family tree. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!showDeleteRelDialog} onOpenChange={(open) => !open && setShowDeleteRelDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Relationship?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the relationship between these two people. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (showDeleteRelDialog) {
                  onDeleteRelationship(showDeleteRelDialog);
                  setShowDeleteRelDialog(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingRelationship}
            >
              {isDeletingRelationship ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingRelationship} onOpenChange={(open) => !open && setEditingRelationship(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Relationship</DialogTitle>
            <DialogDescription>
              Update the relationship type or "by marriage" status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Relationship Type</Label>
              <Select
                value={editRelType}
                onValueChange={(value) => setEditRelType(value as RelationshipType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship type" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(editRelType === "spouse" || editRelType === "partner") && (
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="editByMarriage">By Marriage</Label>
                  <p className="text-xs text-muted-foreground">
                    Mark this relationship as "by marriage"
                  </p>
                </div>
                <Switch
                  id="editByMarriage"
                  checked={editByMarriage}
                  onCheckedChange={setEditByMarriage}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRelationship(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRelationship} disabled={isUpdatingRelationship}>
              {isUpdatingRelationship ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { TreeMember, RelationshipType, CreateRelationshipInput } from "@/types/database";

interface RelationshipFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  fromPerson: TreeMember | null;
  members: TreeMember[];
  onSubmit: (data: CreateRelationshipInput) => void;
  isLoading?: boolean;
  existingRelationships?: { from_person_id: string; to_person_id: string }[];
  defaultRelationType?: RelationshipType;
  descriptionText?: string;
}

const relationshipTypes: { value: RelationshipType; label: string }[] = [
  { value: "parent", label: "Parent" },
  { value: "spouse", label: "Spouse" },
  { value: "partner", label: "Partner" },
];

export function RelationshipFormDialog({
  open,
  onOpenChange,
  treeId,
  fromPerson,
  members,
  onSubmit,
  isLoading,
  existingRelationships = [],
  defaultRelationType,
}: RelationshipFormDialogProps) {
  const [toPersonId, setToPersonId] = useState("");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>(defaultRelationType || "parent");
  const [byMarriage, setByMarriage] = useState(false);

  useEffect(() => {
    if (open) {
      setToPersonId("");
      setRelationshipType(defaultRelationType || "parent");
      setByMarriage(false);
    }
  }, [open, defaultRelationType]);

  const availableMembers = members.filter((m) => {
    if (!fromPerson) return true;
    if (m.id === fromPerson.id) return false;
    
    // Check if relationship already exists
    const exists = existingRelationships.some(
      (r) =>
        (r.from_person_id === fromPerson.id && r.to_person_id === m.id) ||
        (r.from_person_id === m.id && r.to_person_id === fromPerson.id)
    );
    return !exists;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromPerson || !toPersonId || !relationshipType) return;

    onSubmit({
      family_tree_id: treeId,
      from_person_id: fromPerson.id,
      to_person_id: toPersonId,
      relationship_type: relationshipType,
      by_marriage: byMarriage,
    });
  };

  const showByMarriage = relationshipType === "spouse" || relationshipType === "partner";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            Add Relationship
            {fromPerson && (
              <span className="text-muted-foreground font-normal text-sm ml-2">
                for {fromPerson.first_name} {fromPerson.last_name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Relationship Type *</Label>
            <Select
              value={relationshipType}
              onValueChange={(value) => setRelationshipType(value as RelationshipType)}
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

          <div className="space-y-2">
            <Label>Related Person *</Label>
            <Select value={toPersonId} onValueChange={setToPersonId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a person" />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    No available members
                  </div>
                ) : (
                  availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {showByMarriage && (
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="byMarriage">By Marriage</Label>
                <p className="text-xs text-muted-foreground">
                  Mark this relationship as "by marriage"
                </p>
              </div>
              <Switch
                id="byMarriage"
                checked={byMarriage}
                onCheckedChange={setByMarriage}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !toPersonId || !relationshipType}
            >
              {isLoading ? "Adding..." : "Add Relationship"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

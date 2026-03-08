import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TreeMember, CreateTreeMemberInput, UpdateTreeMemberInput } from "@/types/database";

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  person?: TreeMember | null;
  onSubmit: (data: CreateTreeMemberInput | (UpdateTreeMemberInput & { id: string })) => void;
  isLoading?: boolean;
}

export function PersonFormDialog({
  open,
  onOpenChange,
  treeId,
  person,
  onSubmit,
  isLoading,
}: PersonFormDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [gender, setGender] = useState("unknown");

  const isEditing = !!person;

  useEffect(() => {
    if (person) {
      setFirstName(person.first_name);
      setLastName(person.last_name || "");
      setBirthDate(person.birth_date || "");
      setDeathDate(person.death_date || "");
      setGender(person.gender || "unknown");
    } else {
      setFirstName("");
      setLastName("");
      setBirthDate("");
      setDeathDate("");
      setGender("unknown");
    }
  }, [person, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim()) return;

    if (isEditing && person) {
      onSubmit({
        id: person.id,
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        birth_date: birthDate || null,
        death_date: deathDate || null,
        gender,
      });
    } else {
      onSubmit({
        family_tree_id: treeId,
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        birth_date: birthDate || undefined,
        death_date: deathDate || undefined,
        gender,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? "Edit Person" : "Add New Person"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="unknown">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deathDate">Death Date</Label>
              <Input
                id="deathDate"
                type="date"
                value={deathDate}
                onChange={(e) => setDeathDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !firstName.trim()}>
              {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Person"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

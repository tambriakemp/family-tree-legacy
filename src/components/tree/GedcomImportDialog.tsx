import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { parseGedcom, type ParsedIndividual, type ParsedFamily } from "@/lib/gedcomParser";

interface GedcomImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  onSuccess: () => void;
}

export function GedcomImportDialog({ open, onOpenChange, treeId, onSuccess }: GedcomImportDialogProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{ individuals: ParsedIndividual[]; families: ParsedFamily[] } | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const text = await file.text();
    const result = parseGedcom(text);
    setParsed(result);
  };

  const handleImport = async () => {
    if (!parsed || !user) return;
    setImporting(true);
    setProgress(10);

    try {
      // Insert all individuals
      const membersToInsert = parsed.individuals.map((ind) => ({
        family_tree_id: treeId,
        first_name: ind.first_name,
        last_name: ind.last_name,
        birth_date: ind.birth_date,
        death_date: ind.death_date,
        gender: ind.gender,
        created_by_user_id: user.id,
      }));

      // Batch insert — Supabase supports array insert
      const { data: insertedMembers, error: membersError } = await supabase
        .from("tree_members")
        .insert(membersToInsert)
        .select("id");

      if (membersError) throw membersError;

      setProgress(50);

      // Map gedcomId → real UUID (order is preserved)
      const idMap = new Map<string, string>();
      parsed.individuals.forEach((ind, idx) => {
        if (insertedMembers[idx]) {
          idMap.set(ind.gedcomId, insertedMembers[idx].id);
        }
      });

      // Build relationships
      const relationshipsToInsert: {
        family_tree_id: string;
        from_person_id: string;
        to_person_id: string;
        relationship_type: "parent" | "spouse" | "partner";
        by_marriage: boolean;
        created_by_user_id: string;
      }[] = [];

      for (const fam of parsed.families) {
        const husbandUuid = fam.husbandId ? idMap.get(fam.husbandId) : null;
        const wifeUuid = fam.wifeId ? idMap.get(fam.wifeId) : null;

        // Spouse relationship
        if (husbandUuid && wifeUuid) {
          relationshipsToInsert.push({
            family_tree_id: treeId,
            from_person_id: husbandUuid,
            to_person_id: wifeUuid,
            relationship_type: "spouse",
            by_marriage: false,
            created_by_user_id: user.id,
          });
        }

        // Parent → child relationships
        for (const childGedcomId of fam.childIds) {
          const childUuid = idMap.get(childGedcomId);
          if (!childUuid) continue;

          if (husbandUuid) {
            relationshipsToInsert.push({
              family_tree_id: treeId,
              from_person_id: husbandUuid,
              to_person_id: childUuid,
              relationship_type: "parent",
              by_marriage: false,
              created_by_user_id: user.id,
            });
          }
          if (wifeUuid) {
            relationshipsToInsert.push({
              family_tree_id: treeId,
              from_person_id: wifeUuid,
              to_person_id: childUuid,
              relationship_type: "parent",
              by_marriage: false,
              created_by_user_id: user.id,
            });
          }
        }
      }

      setProgress(70);

      if (relationshipsToInsert.length > 0) {
        const { error: relError } = await supabase
          .from("relationships")
          .insert(relationshipsToInsert);

        if (relError) throw relError;
      }

      setProgress(100);
      toast.success(`Imported ${parsed.individuals.length} people successfully!`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("GEDCOM import error:", error);
      toast.error("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setParsed(null);
    setFileName("");
    setProgress(0);
    setImporting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import GEDCOM File</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File input */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".ged,.gedcom"
              onChange={handleFileChange}
              className="hidden"
            />
            {fileName ? (
              <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                <FileText className="w-5 h-5 text-primary" />
                {fileName}
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to select a .ged or .gedcom file
                </p>
              </div>
            )}
          </div>

          {/* Preview summary */}
          {parsed && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground">
              Found <strong>{parsed.individuals.length}</strong> people and{" "}
              <strong>{parsed.families.length}</strong> families
            </div>
          )}

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">Importing...</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!parsed || importing}>
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

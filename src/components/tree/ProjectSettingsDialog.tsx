import { useState } from "react";
import { Settings, Users, UserPlus, Download, Upload, Loader2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface ProjectSettingsDialogProps {
  treeName: string;
  onUpdateName: (name: string) => void;
  isUpdatingName: boolean;
  onOpenCollaborators: () => void;
  onOpenInvite: () => void;
  onExport: () => void;
  isExporting: boolean;
  canExport: boolean;
  onImportGedcom: () => void;
  isOwner: boolean;
}

export function ProjectSettingsDialog({
  treeName,
  onUpdateName,
  isUpdatingName,
  onOpenCollaborators,
  onOpenInvite,
  onExport,
  isExporting,
  canExport,
  onImportGedcom,
  isOwner,
}: ProjectSettingsDialogProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(treeName);

  const handleSaveName = () => {
    if (editName.trim() && editName.trim() !== treeName) {
      onUpdateName(editName.trim());
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditName(treeName);
    setIsEditingName(false);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" title="Project Settings">
          <Settings className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[360px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="font-display">Project Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Tree Name */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Family Tree Name
            </label>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveName}
                  disabled={isUpdatingName || !editName.trim()}
                >
                  {isUpdatingName ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground flex-1 truncate">
                  {treeName}
                </span>
                {isOwner && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditName(treeName);
                      setIsEditingName(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Collaborators */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground block">
              Collaborators
            </label>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="justify-start"
                onClick={onOpenCollaborators}
              >
                <Users className="w-4 h-4 mr-2" />
                View Collaborators
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={onOpenInvite}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Collaborator
              </Button>
            </div>
          </div>

          <Separator />

          {/* Import / Export */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground block">
              Import & Export
            </label>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="justify-start"
                onClick={onExport}
                disabled={isExporting || !canExport}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {isExporting ? "Exporting..." : "Export as Image"}
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={onImportGedcom}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import GEDCOM
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

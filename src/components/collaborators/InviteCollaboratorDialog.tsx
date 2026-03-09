import { useState, useEffect } from "react";
import { Copy, Check, Link as LinkIcon, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { CollaboratorRole } from "@/types/database";

interface InviteCollaboratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  onSubmit?: (data: { email: string; role: CollaboratorRole }) => Promise<void>;
  isLoading?: boolean;
}

export function InviteCollaboratorDialog({
  open,
  onOpenChange,
  treeId,
}: InviteCollaboratorDialogProps) {
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    if (open && treeId) {
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/trees/${treeId}?invite=${role}`);
    }
  }, [open, treeId, role]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = inviteLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setCopied(false);
      setRole("editor");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Invite Collaborator
          </DialogTitle>
          <DialogDescription>
            Share this link with anyone you'd like to invite to your family tree.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Permission Level</Label>
            <Select value={role} onValueChange={(value: "editor" | "viewer") => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor — can add, edit, and delete</SelectItem>
                <SelectItem value="viewer">Viewer — can only view</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Invite Link</Label>
            <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/50 px-3 py-2">
              <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground truncate flex-1">
                {inviteLink}
              </span>
            </div>
          </div>

          <Button
            onClick={handleCopyLink}
            className="w-full"
            variant={copied ? "outline" : "default"}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Invite Link
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Anyone with this link can join the tree as a {role}. They'll need to sign up or log in first.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

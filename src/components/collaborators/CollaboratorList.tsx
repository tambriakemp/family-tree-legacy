import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  Crown, 
  Edit3, 
  Eye, 
  MoreVertical, 
  RefreshCw, 
  Trash2, 
  UserCheck, 
  Clock,
  XCircle 
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { TreeCollaborator, CollaboratorRole } from "@/types/database";

interface CollaboratorListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborators: TreeCollaborator[];
  onUpdateRole: (id: string, role: CollaboratorRole) => void;
  onRemove: (id: string) => void;
  onResendInvite: (collaborator: TreeCollaborator) => void;
  onInviteClick: () => void;
  isOwner: boolean;
}

const roleIcons = {
  owner: Crown,
  editor: Edit3,
  viewer: Eye,
};

const statusConfig = {
  pending: { icon: Clock, label: "Pending", variant: "secondary" as const },
  accepted: { icon: UserCheck, label: "Accepted", variant: "default" as const },
  declined: { icon: XCircle, label: "Declined", variant: "destructive" as const },
};

export function CollaboratorList({
  open,
  onOpenChange,
  collaborators,
  onUpdateRole,
  onRemove,
  onResendInvite,
  onInviteClick,
  isOwner,
}: CollaboratorListProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Collaborators</SheetTitle>
          <SheetDescription>
            Manage who has access to this family tree.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isOwner && (
            <Button onClick={onInviteClick} className="w-full">
              Invite Collaborator
            </Button>
          )}

          <Separator />

          <div className="space-y-3">
            {collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No collaborators yet. Invite family members to share this tree.
              </p>
            ) : (
              collaborators.map((collaborator) => (
                <CollaboratorItem
                  key={collaborator.id}
                  collaborator={collaborator}
                  onUpdateRole={onUpdateRole}
                  onRemove={onRemove}
                  onResendInvite={onResendInvite}
                  isOwner={isOwner}
                />
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface CollaboratorItemProps {
  collaborator: TreeCollaborator;
  onUpdateRole: (id: string, role: CollaboratorRole) => void;
  onRemove: (id: string) => void;
  onResendInvite: (collaborator: TreeCollaborator) => void;
  isOwner: boolean;
}

function CollaboratorItem({
  collaborator,
  onUpdateRole,
  onRemove,
  onResendInvite,
  isOwner,
}: CollaboratorItemProps) {
  const RoleIcon = roleIcons[collaborator.role];
  const status = statusConfig[collaborator.invite_status];
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {collaborator.email}
          </span>
          <Badge variant={status.variant} className="text-xs">
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <RoleIcon className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground capitalize">
            {collaborator.role}
          </span>
          <span className="text-xs text-muted-foreground">
            · Invited {formatDistanceToNow(new Date(collaborator.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {isOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {collaborator.invite_status === "pending" && (
              <>
                <DropdownMenuItem onClick={() => onResendInvite(collaborator)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Invite
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => onUpdateRole(collaborator.id, "editor")}>
              <Edit3 className="w-4 h-4 mr-2" />
              Make Editor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateRole(collaborator.id, "viewer")}>
              <Eye className="w-4 h-4 mr-2" />
              Make Viewer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onRemove(collaborator.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

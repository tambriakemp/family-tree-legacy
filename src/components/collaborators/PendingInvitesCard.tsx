import { Check, X, TreeDeciduous } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TreeCollaboratorWithTree } from "@/types/database";

interface PendingInvitesCardProps {
  invites: TreeCollaboratorWithTree[];
  onAccept: (inviteId: string) => void;
  onDecline: (inviteId: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
}

export function PendingInvitesCard({
  invites,
  onAccept,
  onDecline,
  isAccepting = false,
  isDeclining = false,
}: PendingInvitesCardProps) {
  if (invites.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TreeDeciduous className="w-5 h-5 text-primary" />
          Pending Invitations
        </CardTitle>
        <CardDescription>
          You've been invited to collaborate on these family trees
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background border"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {invite.family_trees?.title || "Family Tree"}
                </span>
                <Badge variant="secondary" className="capitalize text-xs">
                  {invite.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Invited as {invite.role === "editor" ? "an editor" : "a viewer"}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecline(invite.id)}
                disabled={isDeclining}
              >
                <X className="w-4 h-4 mr-1" />
                Decline
              </Button>
              <Button
                size="sm"
                onClick={() => onAccept(invite.id)}
                disabled={isAccepting}
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

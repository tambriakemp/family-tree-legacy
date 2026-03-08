import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, TreeDeciduous, LogOut, Loader2, MoreVertical, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { useFamilyTrees, useTreeMemberCounts } from "@/hooks/useFamilyTrees";
import { usePendingInvites } from "@/hooks/useCollaborators";
import { CreateTreeDialog } from "@/components/tree/CreateTreeDialog";
import { PendingInvitesCard } from "@/components/collaborators/PendingInvitesCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { format } from "date-fns";
import type { TreeCollaboratorWithTree } from "@/types/database";

const Dashboard = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { trees, isLoading: treesLoading, createTree, deleteTree } = useFamilyTrees();
  const { pendingInvites, acceptInvite, declineInvite } = usePendingInvites();
  const treeIds = trees.map((t) => t.id);
  const { data: memberCounts } = useTreeMemberCounts(treeIds);
  const [searchParams] = useSearchParams();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [treeToDelete, setTreeToDelete] = useState<string | null>(null);
  
  // Show debug panel only when ?debug=1 is present
  const showDebug = searchParams.get("debug") === "1";
  
  // Debug state for RLS investigation (only load when needed)
  const [debugInfo, setDebugInfo] = useState<{
    sessionUserId: string | null;
    dbAuthUid: string | null;
    dbJwtSub: string | null;
    dbJwtRole: string | null;
    error: string | null;
  } | null>(null);


  // Handle invite deep link
  useEffect(() => {
    const inviteId = searchParams.get("invite");
    if (inviteId && pendingInvites.length > 0) {
      const matchingInvite = pendingInvites.find((inv) => inv.id === inviteId);
      if (matchingInvite) {
        acceptInvite.mutate(inviteId);
      }
    }
  }, [searchParams, pendingInvites]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleCreateTree = async (data: { title: string; description?: string }) => {
    const result = await createTree.mutateAsync(data);
    setShowCreateDialog(false);
    navigate(`/trees/${result.id}`);
  };

  const handleDeleteTree = async () => {
    if (treeToDelete) {
      await deleteTree.mutateAsync(treeToDelete);
      setTreeToDelete(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}!
            </h1>
            <p className="text-muted-foreground">Manage your family trees</p>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>


        {/* Pending Invites */}
        <PendingInvitesCard
          invites={pendingInvites as TreeCollaboratorWithTree[]}
          onAccept={(id) => acceptInvite.mutate(id)}
          onDecline={(id) => declineInvite.mutate(id)}
          isAccepting={acceptInvite.isPending}
          isDeclining={declineInvite.isPending}
        />

        {/* Trees Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"
        >
          {/* Create Tree Card */}
          <button
            onClick={() => setShowCreateDialog(true)}
            className="group h-48 rounded-2xl border-2 border-dashed border-primary/30 bg-sage-light/20 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-sage-light/40 transition-all cursor-pointer"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-sage flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow">
              <Plus className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-medium text-primary">Create New Tree</span>
          </button>

          {/* Loading state */}
          {treesLoading && (
            <div className="h-48 rounded-2xl border border-border bg-card flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Tree Cards */}
          {trees.map((tree) => (
            <div
              key={tree.id}
              className="h-48 rounded-2xl border border-border bg-card shadow-soft p-6 flex flex-col justify-between card-hover relative group"
            >
              <div className="flex items-start justify-between">
                <Link to={`/trees/${tree.id}`} className="flex-1">
                  <div className="w-12 h-12 rounded-xl bg-sage-light flex items-center justify-center">
                    <TreeDeciduous className="w-6 h-6 text-primary" />
                  </div>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/trees/${tree.id}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Open
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setTreeToDelete(tree.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Link to={`/trees/${tree.id}`}>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  {tree.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Created {format(new Date(tree.created_at), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {memberCounts && memberCounts[tree.id] > 0
                    ? `${memberCounts[tree.id]} people`
                    : "No members yet"}
                </p>
              </Link>
            </div>
          ))}
        </motion.div>

        {/* Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 p-6 rounded-2xl bg-gradient-hero border border-border"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                Free Trial
              </h3>
              <p className="text-muted-foreground">
                Upgrade to unlock unlimited trees and collaborators
              </p>
            </div>
            <Button variant="hero">Upgrade to Pro - $6/mo</Button>
          </div>
        </motion.div>
      </main>

      {/* Create Tree Dialog */}
      <CreateTreeDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateTree}
        isLoading={createTree.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!treeToDelete} onOpenChange={() => setTreeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Family Tree?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this family tree and all its members,
              relationships, photos, and events. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTree}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTree.isPending}
            >
              {deleteTree.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;

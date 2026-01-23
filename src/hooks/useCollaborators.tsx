import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { TreeCollaborator, CollaboratorRole } from "@/types/database";

export interface CreateInviteInput {
  family_tree_id: string;
  email: string;
  role: CollaboratorRole;
}

export function useCollaborators(treeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const collaboratorsQuery = useQuery({
    queryKey: ["collaborators", treeId],
    queryFn: async () => {
      if (!treeId) return [];
      const { data, error } = await supabase
        .from("tree_collaborators")
        .select("*")
        .eq("family_tree_id", treeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TreeCollaborator[];
    },
    enabled: !!treeId,
  });

  const sendInvite = useMutation({
    mutationFn: async (input: CreateInviteInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if invite already exists
      const { data: existing } = await supabase
        .from("tree_collaborators")
        .select("id, invite_status")
        .eq("family_tree_id", input.family_tree_id)
        .eq("email", input.email.toLowerCase())
        .single();

      if (existing) {
        if (existing.invite_status === "accepted") {
          throw new Error("This person is already a collaborator");
        }
        throw new Error("An invite has already been sent to this email");
      }

      // Insert the invite
      const { data, error } = await supabase
        .from("tree_collaborators")
        .insert({
          family_tree_id: input.family_tree_id,
          email: input.email.toLowerCase(),
          role: input.role,
          invited_by_user_id: user.id,
          invite_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Call edge function to send invite email
      const { error: emailError } = await supabase.functions.invoke("send-invite", {
        body: {
          inviteId: data.id,
          email: input.email.toLowerCase(),
          treeId: input.family_tree_id,
        },
      });

      if (emailError) {
        console.error("Failed to send invite email:", emailError);
        // Don't throw - invite is still created, just email failed
      }

      return data as TreeCollaborator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators", treeId] });
      toast({
        title: "Invite sent",
        description: "The invitation has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invite",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCollaboratorRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: CollaboratorRole }) => {
      const { data, error } = await supabase
        .from("tree_collaborators")
        .update({ role })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as TreeCollaborator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators", treeId] });
      toast({
        title: "Role updated",
        description: "Collaborator role has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeCollaborator = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tree_collaborators")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators", treeId] });
      toast({
        title: "Collaborator removed",
        description: "The collaborator has been removed from this tree.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove collaborator",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendInvite = useMutation({
    mutationFn: async (collaborator: TreeCollaborator) => {
      const { error } = await supabase.functions.invoke("send-invite", {
        body: {
          inviteId: collaborator.id,
          email: collaborator.email,
          treeId: collaborator.family_tree_id,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Invite resent",
        description: "The invitation email has been resent.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resend invite",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    collaborators: collaboratorsQuery.data || [],
    isLoading: collaboratorsQuery.isLoading,
    sendInvite,
    updateCollaboratorRole,
    removeCollaborator,
    resendInvite,
  };
}

// Hook for fetching user's pending invites
export function usePendingInvites() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const pendingInvitesQuery = useQuery({
    queryKey: ["pending-invites"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return [];

      const { data, error } = await supabase
        .from("tree_collaborators")
        .select(`
          *,
          family_trees:family_tree_id (
            id,
            title,
            owner_user_id
          )
        `)
        .eq("email", user.email.toLowerCase())
        .eq("invite_status", "pending");

      if (error) throw error;
      return data;
    },
  });

  const acceptInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tree_collaborators")
        .update({
          user_id: user.id,
          invite_status: "accepted",
        })
        .eq("id", inviteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      queryClient.invalidateQueries({ queryKey: ["family-trees"] });
      toast({
        title: "Invite accepted",
        description: "You now have access to this family tree.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept invite",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const declineInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { data, error } = await supabase
        .from("tree_collaborators")
        .update({ invite_status: "declined" })
        .eq("id", inviteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      toast({
        title: "Invite declined",
        description: "The invitation has been declined.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to decline invite",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    pendingInvites: pendingInvitesQuery.data || [],
    isLoading: pendingInvitesQuery.isLoading,
    acceptInvite,
    declineInvite,
  };
}

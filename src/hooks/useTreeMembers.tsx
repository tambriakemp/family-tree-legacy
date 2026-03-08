import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { TreeMember, CreateTreeMemberInput, UpdateTreeMemberInput } from "@/types/database";

export function useTreeMembers(treeId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ["tree-members", treeId],
    queryFn: async () => {
      if (!treeId) return [];
      const { data, error } = await supabase
        .from("tree_members")
        .select("*")
        .eq("family_tree_id", treeId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as TreeMember[];
    },
    enabled: !!treeId && !!user,
  });

  const createMember = useMutation({
    mutationFn: async (input: CreateTreeMemberInput) => {
      const { data, error } = await supabase
        .from("tree_members")
        .insert({
          family_tree_id: input.family_tree_id,
          first_name: input.first_name,
          last_name: input.last_name || null,
          birth_date: input.birth_date || null,
          death_date: input.death_date || null,
          gender: input.gender || 'unknown',
          profile_photo_url: input.profile_photo_url || null,
          created_by_user_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as TreeMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tree-members", treeId] });
      toast.success("Person added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add person: " + error.message);
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...input }: UpdateTreeMemberInput & { id: string }) => {
      const { data, error } = await supabase
        .from("tree_members")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as TreeMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tree-members", treeId] });
      toast.success("Person updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update person: " + error.message);
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tree_members")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tree-members", treeId] });
      queryClient.invalidateQueries({ queryKey: ["relationships", treeId] });
      toast.success("Person removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove person: " + error.message);
    },
  });

  return {
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    error: membersQuery.error,
    createMember,
    updateMember,
    deleteMember,
  };
}

export function useTreeMember(memberId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tree-member", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase
        .from("tree_members")
        .select("*")
        .eq("id", memberId)
        .single();
      
      if (error) throw error;
      return data as TreeMember;
    },
    enabled: !!memberId && !!user,
  });
}

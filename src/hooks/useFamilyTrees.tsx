import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { FamilyTree, CreateFamilyTreeInput } from "@/types/database";

export function useFamilyTrees() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const treesQuery = useQuery({
    queryKey: ["family-trees"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("family_trees")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as FamilyTree[];
    },
    enabled: !!user,
  });

  const createTree = useMutation({
    mutationFn: async (input: CreateFamilyTreeInput) => {
      if (!user) {
        throw new Error("You must be logged in to create a tree");
      }
      const { data, error } = await supabase
        .from("family_trees")
        .insert({
          title: input.title,
          description: input.description || null,
          owner_user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as FamilyTree;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-trees"] });
      toast.success("Family tree created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create family tree: " + error.message);
    },
  });

  const updateTree = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateFamilyTreeInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("family_trees")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as FamilyTree;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-trees"] });
      toast.success("Family tree updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update family tree: " + error.message);
    },
  });

  const deleteTree = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("family_trees")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-trees"] });
      toast.success("Family tree deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete family tree: " + error.message);
    },
  });

  return {
    trees: treesQuery.data || [],
    isLoading: treesQuery.isLoading,
    error: treesQuery.error,
    createTree,
    updateTree,
    deleteTree,
  };
}

export function useFamilyTree(treeId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["family-tree", treeId],
    queryFn: async () => {
      if (!treeId) return null;
      const { data, error } = await supabase
        .from("family_trees")
        .select("*")
        .eq("id", treeId)
        .single();
      
      if (error) throw error;
      return data as FamilyTree;
    },
    enabled: !!treeId && !!user,
  });
}

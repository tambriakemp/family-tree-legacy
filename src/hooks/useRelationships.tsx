import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Relationship, CreateRelationshipInput } from "@/types/database";

export function useRelationships(treeId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const relationshipsQuery = useQuery({
    queryKey: ["relationships", treeId],
    queryFn: async () => {
      if (!treeId) return [];
      const { data, error } = await supabase
        .from("relationships")
        .select("*")
        .eq("family_tree_id", treeId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as Relationship[];
    },
    enabled: !!treeId && !!user,
  });

  const createRelationship = useMutation({
    mutationFn: async (input: CreateRelationshipInput) => {
      const { data, error } = await supabase
        .from("relationships")
        .insert({
          family_tree_id: input.family_tree_id,
          from_person_id: input.from_person_id,
          to_person_id: input.to_person_id,
          relationship_type: input.relationship_type,
          by_marriage: input.by_marriage ?? false,
          created_by_user_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Relationship;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relationships", treeId] });
      toast.success("Relationship added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add relationship: " + error.message);
    },
  });

  const updateRelationship = useMutation({
    mutationFn: async ({ id, by_marriage }: { id: string; by_marriage: boolean }) => {
      const { data, error } = await supabase
        .from("relationships")
        .update({ by_marriage })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Relationship;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relationships", treeId] });
      toast.success("Relationship updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update relationship: " + error.message);
    },
  });

  const deleteRelationship = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("relationships")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relationships", treeId] });
      toast.success("Relationship removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove relationship: " + error.message);
    },
  });

  // Helper to get relationships for a specific person
  const getPersonRelationships = (personId: string) => {
    const relationships = relationshipsQuery.data || [];
    return relationships.filter(
      (r) => r.from_person_id === personId || r.to_person_id === personId
    );
  };

  return {
    relationships: relationshipsQuery.data || [],
    isLoading: relationshipsQuery.isLoading,
    error: relationshipsQuery.error,
    createRelationship,
    updateRelationship,
    deleteRelationship,
    getPersonRelationships,
  };
}

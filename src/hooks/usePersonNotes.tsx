import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { PersonNote, CreatePersonNoteInput } from "@/types/database";

export function usePersonNotes(personId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const notesQuery = useQuery({
    queryKey: ["person-notes", personId],
    queryFn: async () => {
      if (!personId) return [];
      const { data, error } = await supabase
        .from("person_notes")
        .select("*")
        .eq("person_id", personId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PersonNote[];
    },
    enabled: !!personId && !!user,
  });

  const createNote = useMutation({
    mutationFn: async (input: CreatePersonNoteInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("person_notes")
        .insert({
          ...input,
          author_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PersonNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person-notes", personId] });
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data, error } = await supabase
        .from("person_notes")
        .update({ content })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as PersonNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person-notes", personId] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("person_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person-notes", personId] });
    },
  });

  return {
    notes: notesQuery.data || [],
    isLoading: notesQuery.isLoading,
    createNote,
    updateNote,
    deleteNote,
  };
}

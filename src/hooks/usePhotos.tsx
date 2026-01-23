import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Photo, PhotoWithTags, CreatePhotoInput, PhotoTag } from "@/types/database";

export function usePhotos(treeId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const photosQuery = useQuery({
    queryKey: ["photos", treeId],
    queryFn: async () => {
      if (!treeId) return [];
      const { data, error } = await supabase
        .from("photos")
        .select("*, photo_tags(*)")
        .eq("family_tree_id", treeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PhotoWithTags[];
    },
    enabled: !!treeId && !!user,
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({ file, caption, treeId }: { file: File; caption?: string; treeId: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("family-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("family-photos")
        .getPublicUrl(fileName);

      // Create photo record
      const photoInput: CreatePhotoInput = {
        family_tree_id: treeId,
        storage_path: fileName,
        url: urlData.publicUrl,
        caption,
      };

      const { data, error } = await supabase
        .from("photos")
        .insert({
          ...photoInput,
          uploaded_by_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Photo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", treeId] });
    },
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      // Get photo to delete from storage
      const { data: photo, error: fetchError } = await supabase
        .from("photos")
        .select("storage_path")
        .eq("id", photoId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("family-photos")
        .remove([photo.storage_path]);

      if (storageError) console.warn("Storage delete failed:", storageError);

      // Delete record
      const { error } = await supabase
        .from("photos")
        .delete()
        .eq("id", photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", treeId] });
    },
  });

  const addPhotoTag = useMutation({
    mutationFn: async ({ photoId, personId }: { photoId: string; personId: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("photo_tags")
        .insert({
          photo_id: photoId,
          person_id: personId,
          tagged_by_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PhotoTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", treeId] });
    },
  });

  const removePhotoTag = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from("photo_tags")
        .delete()
        .eq("id", tagId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", treeId] });
    },
  });

  return {
    photos: photosQuery.data || [],
    isLoading: photosQuery.isLoading,
    uploadPhoto,
    deletePhoto,
    addPhotoTag,
    removePhotoTag,
  };
}

export function usePersonPhotos(personId: string | undefined, treeId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["person-photos", personId],
    queryFn: async () => {
      if (!personId || !treeId) return [];

      const { data, error } = await supabase
        .from("photos")
        .select("*, photo_tags!inner(*)")
        .eq("family_tree_id", treeId)
        .eq("photo_tags.person_id", personId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PhotoWithTags[];
    },
    enabled: !!personId && !!treeId && !!user,
  });
}

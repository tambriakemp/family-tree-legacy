-- Create storage bucket for family photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-photos', 'family-photos', true);

-- RLS policies for family photos storage
CREATE POLICY "Users can view photos in accessible trees"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'family-photos' 
  AND EXISTS (
    SELECT 1 FROM public.photos p
    WHERE p.storage_path = name
      AND public.has_tree_access(auth.uid(), p.family_tree_id)
  )
);

CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'family-photos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'family-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'family-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
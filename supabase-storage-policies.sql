-- Policies pour le bucket 'product-images'
-- A exécuter dans l'éditeur SQL de Supabase (SQL Editor)

-- 1. Permettre aux utilisateurs authentifiés d'uploader des images dans leur dossier
CREATE POLICY "Users can upload images to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Permettre aux utilisateurs de mettre à jour leurs propres images
CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Permettre aux utilisateurs de supprimer leurs propres images
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Permettre à tout le monde de voir les images (bucket public)
CREATE POLICY "Anyone can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

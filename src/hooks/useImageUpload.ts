import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

const BUCKET_NAME = 'product-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface UploadResult {
  url: string | null;
  error: string | null;
}

export function useImageUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Le fichier est trop volumineux. Maximum 5 Mo.';
    }
    return null;
  };

  const uploadImage = async (file: File): Promise<UploadResult> => {
    if (!user) {
      return { url: null, error: 'Vous devez être connecté pour uploader une image.' };
    }

    const validationError = validateFile(file);
    if (validationError) {
      return { url: null, error: validationError };
    }

    setUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      setProgress(30);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // If bucket doesn't exist, provide helpful error
        if (uploadError.message.includes('Bucket not found')) {
          return {
            url: null,
            error: 'Le stockage d\'images n\'est pas configuré. Contactez l\'administrateur.'
          };
        }
        throw uploadError;
      }

      setProgress(80);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      setProgress(100);

      return { url: publicUrl, error: null };
    } catch (err) {
      console.error('Upload error:', err);
      return {
        url: null,
        error: err instanceof Error ? err.message : 'Erreur lors de l\'upload'
      };
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split(`/${BUCKET_NAME}/`);
      if (pathParts.length < 2) return false;

      const filePath = pathParts[1];

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      return !error;
    } catch {
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading,
    progress,
    maxFileSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_TYPES
  };
}

'use server';

import { ResultAsync } from 'neverthrow';
import { supabase } from '../../../lib/supabase';
import { AppError } from '@/lib/actions';

/**
 * Upload an image to Supabase storage
 *
 * @param formData - FormData containing the image file and user ID
 * @returns ResultAsync containing the image URL or an error
 */
export async function uploadImage(
  formData: FormData
): Promise<ResultAsync<{ url: string }, AppError>> {
  // Extract and validate the form data
  const userId = formData.get('userId')?.toString() || '';
  const file = formData.get('file') as File;

  // Validate file presence
  if (!file || !(file instanceof File)) {
    throw new Error('No file provided or invalid file');
  }

  // Create a unique filename
  const filename = `${userId}_${Date.now()}_${file.name}`;

  // Use Supabase storage for file upload
  return ResultAsync.fromPromise(
    supabase.storage
      .from('memo-images')
      .upload(filename, file)
      .then(({ error }) => {
        if (error) throw error;

        // Get the public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('memo-images').getPublicUrl(filename);

        return { url: publicUrl };
      }),
    (error) => {
      console.error('Error uploading image:', error);
      return {
        message: 'Failed to upload image',
        cause: error,
      };
    }
  );
}

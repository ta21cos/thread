'use server';

import { errAsync, ResultAsync } from 'neverthrow';
import { supabase } from '../../../lib/supabase';
import { AppError, ImageUploadSchema } from './schema';

// TODO: auth の実装
/**
 * Upload an image to Supabase storage
 *
 * @param formData - FormData containing the image file and user ID
 * @returns ResultAsync containing the image URL or an error
 */
export async function uploadImage(
  formData: FormData
): Promise<ResultAsync<{ url: string }, AppError>> {
  // Extract form data
  const userId = formData.get('userId')?.toString() || '';
  const file = formData.get('file') as File;

  // Validate file presence
  if (!file || !(file instanceof File)) {
    return errAsync({
      message: 'No file provided or invalid file',
      cause: new Error('No file provided or invalid file'),
    });
  }

  // Validate user ID with zod schema using safeParse
  const validation = ImageUploadSchema.safeParse({ userId });

  // If validation failed, return error result
  if (!validation.success) {
    console.error('Validation error:', validation.error.errors);
    return errAsync({
      message: 'Invalid user ID',
      cause: validation.error.errors,
    });
  }

  // Validation succeeded, extract the validated user ID
  const { userId: validatedUserId } = validation.data;

  // Create a unique filename
  const filename = `${validatedUserId}_${Date.now()}_${file.name}`;

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

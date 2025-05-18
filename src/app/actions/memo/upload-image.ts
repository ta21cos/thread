'use server';

import { ResultAsync } from 'neverthrow';
import { supabase } from '../../../lib/supabase';
import { ImageUploadInput, ImageUploadSchema } from './schema';
import { SerializableResult } from './types';
import { toSerializable } from './utils';

/**
 * Upload an image to Supabase storage
 *
 * @param input - Object containing the user ID
 * @param file - File to upload
 * @returns Serializable result containing the image URL or an error
 */
export async function uploadImage(
  input: ImageUploadInput,
  file: File
): Promise<SerializableResult<{ url: string }>> {
  // Validate file presence
  if (!file || !(file instanceof File)) {
    return {
      success: false,
      error: {
        message: 'No file provided or invalid file',
        cause: new Error('No file provided or invalid file'),
      },
    };
  }

  // Validate user ID with zod schema using safeParse
  const validation = ImageUploadSchema.safeParse(input);

  // If validation failed, return error result
  if (!validation.success) {
    console.error('Validation error:', validation.error.errors);
    return {
      success: false,
      error: {
        message: 'Invalid user ID',
        cause: validation.error.errors,
      },
    };
  }

  // Validation succeeded, extract the validated user ID
  const { userId: validatedUserId } = validation.data;

  // Create a unique filename
  const filename = `${validatedUserId}_${Date.now()}_${file.name}`;

  // Use Supabase storage for file upload
  const result = await ResultAsync.fromPromise(
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

  // Convert ResultAsync to SerializableResult
  return toSerializable(result);
}

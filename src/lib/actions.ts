'use server';

import { revalidatePath } from 'next/cache';
import { ResultAsync } from 'neverthrow';
import { storage } from './supabase';
import { Memo } from '@/generated/prisma';
import { MemoRepository } from './db';

// StructuredClone-able result type for client
// Client cannot receive neverthrow's result type directly
export type ActionResult<T, E> = { ok: true; data: T } | { ok: false; error: E };

// Define error types
export type AppError = {
  message: string;
  cause?: unknown;
};

export async function toActionResult<T, E extends AppError>(
  result: ResultAsync<T, E>
): Promise<ActionResult<T, E>> {
  return await result.match(
    (data) => ({ ok: true, data }),
    (error) => ({ ok: false, error })
  );
}

/**
 * Create a new memo
 */
export async function createMemo({
  content,
  user_id,
  parent_id,
}: {
  content: string;
  user_id: string;
  parent_id: string | null;
}): Promise<ActionResult<Memo, AppError>> {
  const result = ResultAsync.fromPromise(
    MemoRepository.create({
      content,
      user_id,
      parent_id,
    }).then((result) => {
      // Revalidate the path to update the UI
      revalidatePath('/dashboard');
      return result;
    }),
    (error) => {
      return {
        message: 'Failed to create memo',
        cause: error,
      };
    }
  );
  return toActionResult(result);
}

/**
 * Get all memos (root level, no parent)
 */
export async function getMemos(): Promise<ActionResult<Memo[], AppError>> {
  const result = ResultAsync.fromPromise(MemoRepository.findAll(), (error) => {
    console.error('Error fetching memos:', error);
    return {
      message: 'Failed to fetch memos',
      cause: error,
    };
  });
  return toActionResult(result);
}

/**
 * Get replies to a specific memo
 */
export async function getReplies({
  memoId,
}: {
  memoId: string;
}): Promise<ActionResult<Memo[], AppError>> {
  const result = ResultAsync.fromPromise(MemoRepository.findReplies(memoId), (error) => {
    console.error('Error fetching replies:', error);
    return {
      message: 'Failed to fetch replies',
      cause: error,
    };
  });
  return toActionResult(result);
}

/**
 * Upload an image to Supabase storage
 */
export async function uploadImage({
  file,
  userId,
}: {
  file: File;
  userId: string;
}): Promise<ActionResult<{ url: string }, AppError>> {
  const filename = `${userId}_${Date.now()}_${file.name}`;

  const result = ResultAsync.fromPromise(
    storage
      .from('memo-images')
      .upload(filename, file)
      .then(({ error }) => {
        if (error) throw error;

        // Get the public URL
        const {
          data: { publicUrl },
        } = storage.from('memo-images').getPublicUrl(filename);

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
  return toActionResult(result);
}

/**
 * Delete a memo
 */
export async function deleteMemo({
  memoId,
}: {
  memoId: string;
}): Promise<ActionResult<void, AppError>> {
  const result = ResultAsync.fromPromise(
    MemoRepository.delete(memoId).then(() => {
      // Revalidate the path to update the UI
      revalidatePath('/dashboard');
    }),
    (error) => {
      console.error('Error deleting memo:', error);
      return {
        message: 'Failed to delete memo',
        cause: error,
      };
    }
  );
  return toActionResult(result);
}

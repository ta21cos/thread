'use server';

import { db, storage } from './db';
import { revalidatePath } from 'next/cache';
import { NewMemo, Memo } from './db/schema';
import { ResultAsync } from 'neverthrow';

// Define error types
export type AppError = {
  message: string;
  cause?: unknown;
};

/**
 * Create a new memo
 */
export function createMemo({ content, user_id, parent_id }: NewMemo): ResultAsync<Memo, AppError> {
  return ResultAsync.fromPromise(
    db.insertInto('memos')
      .values({
        content,
        user_id,
        parent_id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
      .then(result => {
        // Revalidate the path to update the UI
        revalidatePath('/dashboard');
        return result;
      }),
    (error) => {
      console.error('Error creating memo:', error);
      return {
        message: 'Failed to create memo',
        cause: error
      };
    }
  );
}

/**
 * Get all memos (root level, no parent)
 */
export function getMemos(): ResultAsync<Memo[], AppError> {
  return ResultAsync.fromPromise(
    db.selectFrom('memos')
      .where('parent_id', 'is', null)
      .orderBy('created_at', 'desc')
      .selectAll()
      .execute(),
    (error) => {
      console.error('Error fetching memos:', error);
      return {
        message: 'Failed to fetch memos',
        cause: error
      };
    }
  );
}

/**
 * Get replies to a specific memo
 */
export function getReplies({ memoId }: { memoId: string }): ResultAsync<Memo[], AppError> {
  return ResultAsync.fromPromise(
    db.selectFrom('memos')
      .where('parent_id', '=', memoId)
      .orderBy('created_at', 'asc')
      .selectAll()
      .execute(),
    (error) => {
      console.error('Error fetching replies:', error);
      return {
        message: 'Failed to fetch replies',
        cause: error
      };
    }
  );
}

/**
 * Upload an image to Supabase storage
 */
export function uploadImage({ file, userId }: { file: File; userId: string }): ResultAsync<{ url: string }, AppError> {
  const filename = `${userId}_${Date.now()}_${file.name}`;
  
  return ResultAsync.fromPromise(
    storage.from('memo-images')
      .upload(filename, file)
      .then(({ error }) => {
        if (error) throw error;
        
        // Get the public URL
        const { data: { publicUrl } } = storage
          .from('memo-images')
          .getPublicUrl(filename);
        
        return { url: publicUrl };
      }),
    (error) => {
      console.error('Error uploading image:', error);
      return {
        message: 'Failed to upload image',
        cause: error
      };
    }
  );
}

/**
 * Delete a memo
 */
export function deleteMemo({ memoId }: { memoId: string }): ResultAsync<void, AppError> {
  return ResultAsync.fromPromise(
    // First delete all replies
    db.deleteFrom('memos')
      .where('parent_id', '=', memoId)
      .execute()
      .then(() => {
        // Then delete the memo itself
        return db.deleteFrom('memos')
          .where('id', '=', memoId)
          .execute();
      })
      .then(() => {
        // Revalidate the path to update the UI
        revalidatePath('/dashboard');
      }),
    (error) => {
      console.error('Error deleting memo:', error);
      return {
        message: 'Failed to delete memo',
        cause: error
      };
    }
  );
}

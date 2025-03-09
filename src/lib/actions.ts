'use server';

import { db, storage } from './db';
import { revalidatePath } from 'next/cache';
import { NewMemo } from './db/schema';

/**
 * Create a new memo
 */
export async function createMemo(data: NewMemo) {
  try {
    // Insert the memo into the database
    const result = await db
      .insertInto('memos')
      .values({
        content: data.content,
        user_id: data.user_id,
        parent_id: data.parent_id,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Revalidate the path to update the UI
    revalidatePath('/dashboard');
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating memo:', error);
    return { success: false, error: 'Failed to create memo' };
  }
}

/**
 * Get all memos (root level, no parent)
 */
export async function getMemos() {
  try {
    const memos = await db
      .selectFrom('memos')
      .where('parent_id', 'is', null)
      .orderBy('created_at', 'desc')
      .selectAll()
      .execute();
    
    return { success: true, data: memos };
  } catch (error) {
    console.error('Error fetching memos:', error);
    return { success: false, error: 'Failed to fetch memos' };
  }
}

/**
 * Get replies to a specific memo
 */
export async function getReplies(memoId: string) {
  try {
    const replies = await db
      .selectFrom('memos')
      .where('parent_id', '=', memoId)
      .orderBy('created_at', 'asc')
      .selectAll()
      .execute();
    
    return { success: true, data: replies };
  } catch (error) {
    console.error('Error fetching replies:', error);
    return { success: false, error: 'Failed to fetch replies' };
  }
}

/**
 * Upload an image to Supabase storage
 */
export async function uploadImage(file: File, userId: string) {
  try {
    const filename = `${userId}_${Date.now()}_${file.name}`;
    const { error } = await storage
      .from('memo-images')
      .upload(filename, file);
    
    if (error) throw error;
    
    // Get the public URL
    const { data: { publicUrl } } = storage
      .from('memo-images')
      .getPublicUrl(filename);
    
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: 'Failed to upload image' };
  }
}

/**
 * Delete a memo
 */
export async function deleteMemo(memoId: string) {
  try {
    // First delete all replies
    await db
      .deleteFrom('memos')
      .where('parent_id', '=', memoId)
      .execute();
    
    // Then delete the memo itself
    await db
      .deleteFrom('memos')
      .where('id', '=', memoId)
      .execute();
    
    // Revalidate the path to update the UI
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting memo:', error);
    return { success: false, error: 'Failed to delete memo' };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getAuthProfile } from "./auth";

export async function getPosts(channelId: string) {
  await getAuthProfile();
  return db
    .select()
    .from(posts)
    .where(eq(posts.channelId, channelId))
    .orderBy(asc(posts.createdAt));
}

export async function getPost(id: string) {
  await getAuthProfile();
  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  return post ?? null;
}

export async function createPost(channelId: string, content: string) {
  const profile = await getAuthProfile();

  if (!content?.trim()) {
    return { error: "Content is required" };
  }

  const [post] = await db
    .insert(posts)
    .values({
      channelId,
      content: content.trim(),
      authorId: profile.id,
    })
    .returning();

  revalidatePath(`/channels/${channelId}`);
  return { success: true, id: post.id };
}

export async function updatePost(
  id: string,
  channelId: string,
  content: string,
) {
  await getAuthProfile();

  if (!content?.trim()) {
    return { error: "Content is required" };
  }

  await db
    .update(posts)
    .set({ content: content.trim() })
    .where(eq(posts.id, id));

  revalidatePath(`/channels/${channelId}`);
  return { success: true };
}

export async function deletePost(id: string, channelId: string) {
  await getAuthProfile();

  await db.delete(posts).where(eq(posts.id, id));

  revalidatePath(`/channels/${channelId}`);
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { postReplies } from "@/db/schema";
import { eq, asc, sql, inArray } from "drizzle-orm";
import { getAuthProfile } from "./auth";

export async function getReplies(postId: string) {
  await getAuthProfile();
  return db
    .select()
    .from(postReplies)
    .where(eq(postReplies.postId, postId))
    .orderBy(asc(postReplies.createdAt));
}

export async function getReplyCount(postId: string) {
  await getAuthProfile();
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postReplies)
    .where(eq(postReplies.postId, postId));
  return result?.count ?? 0;
}

export async function getReplyCounts(postIds: string[]) {
  if (postIds.length === 0) return {};

  await getAuthProfile();
  const results = await db
    .select({
      postId: postReplies.postId,
      count: sql<number>`count(*)::int`,
    })
    .from(postReplies)
    .where(inArray(postReplies.postId, postIds))
    .groupBy(postReplies.postId);

  const counts: Record<string, number> = {};
  for (const r of results) {
    counts[r.postId] = r.count;
  }
  return counts;
}

export async function createReply(
  postId: string,
  content: string,
  channelId: string,
) {
  const profile = await getAuthProfile();

  if (!content?.trim()) {
    return { error: "Content is required" };
  }

  const [reply] = await db
    .insert(postReplies)
    .values({
      postId,
      content: content.trim(),
      authorId: profile.id,
    })
    .returning();

  revalidatePath(`/channels/${channelId}`);
  return { success: true, id: reply.id };
}

export async function updateReply(
  id: string,
  content: string,
  channelId: string,
) {
  await getAuthProfile();

  if (!content?.trim()) {
    return { error: "Content is required" };
  }

  await db
    .update(postReplies)
    .set({ content: content.trim() })
    .where(eq(postReplies.id, id));

  revalidatePath(`/channels/${channelId}`);
  return { success: true };
}

export async function deleteReply(id: string, channelId: string) {
  await getAuthProfile();

  await db.delete(postReplies).where(eq(postReplies.id, id));

  revalidatePath(`/channels/${channelId}`);
  return { success: true };
}

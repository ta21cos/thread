"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { stocks, stockTags } from "@/db/schema";
import { eq, and, isNotNull, asc, desc, inArray, sql } from "drizzle-orm";
import { getAuthProfile } from "./auth";
import { getCachedAuthProfile } from "@/lib/cached-auth";
import { posts, postReplies } from "@/db/schema";

export type NoteWithTags = {
  id: string;
  status: string;
  title: string;
  content: string;
  group: string | null;
  sourcePostIds: string;
  sourceChannelId: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
};

export async function getNotes(status?: string): Promise<NoteWithTags[]> {
  const profile = await getCachedAuthProfile();

  const conditions = [eq(stocks.authorId, profile.id)];
  if (status) {
    conditions.push(eq(stocks.status, status));
  }

  const noteRows = await db
    .select()
    .from(stocks)
    .where(and(...conditions))
    .orderBy(desc(stocks.updatedAt));

  if (noteRows.length === 0) return [];

  const noteIds = noteRows.map((n) => n.id);
  const allTags = await db
    .select()
    .from(stockTags)
    .where(inArray(stockTags.stockId, noteIds));

  const tagsByNoteId = new Map<string, string[]>();
  for (const row of noteRows) {
    tagsByNoteId.set(row.id, []);
  }
  for (const t of allTags) {
    tagsByNoteId.get(t.stockId)?.push(t.tag);
  }

  return noteRows.map((note) => ({
    ...note,
    tags: tagsByNoteId.get(note.id) ?? [],
  }));
}

export async function getNoteById(id: string): Promise<NoteWithTags | null> {
  const profile = await getCachedAuthProfile();

  const [note] = await db.select().from(stocks).where(eq(stocks.id, id));

  if (!note || note.authorId !== profile.id) {
    return null;
  }

  const tags = await db
    .select()
    .from(stockTags)
    .where(eq(stockTags.stockId, id));

  return {
    ...note,
    tags: tags.map((t) => t.tag),
  };
}

export async function createNote(data: {
  title: string;
  content: string;
  group?: string | null;
  tags?: string[];
}) {
  const profile = await getAuthProfile();

  if (!data.title?.trim()) {
    return { error: "Title is required" };
  }

  const [note] = await db
    .insert(stocks)
    .values({
      status: "note",
      title: data.title.trim(),
      content: data.content?.trim() ?? "",
      group: data.group?.trim() || null,
      authorId: profile.id,
    })
    .returning();

  if (data.tags && data.tags.length > 0) {
    const uniqueTags = [
      ...new Set(data.tags.map((t) => t.toLowerCase().trim()).filter(Boolean)),
    ];
    if (uniqueTags.length > 0) {
      await db.insert(stockTags).values(
        uniqueTags.map((tag) => ({
          stockId: note.id,
          tag,
        })),
      );
    }
  }

  revalidatePath("/");
  return { success: true, id: note.id };
}

export async function updateNote(
  id: string,
  data: {
    title: string;
    content: string;
    group?: string | null;
    tags?: string[];
  },
) {
  await getAuthProfile();

  if (!data.title?.trim()) {
    return { error: "Title is required" };
  }

  await db
    .update(stocks)
    .set({
      title: data.title.trim(),
      content: data.content?.trim() ?? "",
      group: data.group?.trim() || null,
    })
    .where(eq(stocks.id, id));

  if (data.tags !== undefined) {
    await db.delete(stockTags).where(eq(stockTags.stockId, id));

    const uniqueTags = [
      ...new Set(data.tags.map((t) => t.toLowerCase().trim()).filter(Boolean)),
    ];
    if (uniqueTags.length > 0) {
      await db.insert(stockTags).values(
        uniqueTags.map((tag) => ({
          stockId: id,
          tag,
        })),
      );
    }
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteNote(id: string) {
  await getAuthProfile();

  await db.delete(stocks).where(eq(stocks.id, id));

  revalidatePath("/");
  return { success: true };
}

export async function getGroups(): Promise<string[]> {
  const profile = await getCachedAuthProfile();

  const rows = await db
    .select({ group: stocks.group })
    .from(stocks)
    .where(and(eq(stocks.authorId, profile.id), isNotNull(stocks.group)))
    .orderBy(asc(stocks.group));

  return [
    ...new Set(rows.map((r) => r.group).filter((g): g is string => g !== null)),
  ];
}

export async function getTags(): Promise<string[]> {
  const profile = await getCachedAuthProfile();

  const noteIds = await db
    .select({ id: stocks.id })
    .from(stocks)
    .where(eq(stocks.authorId, profile.id));

  if (noteIds.length === 0) return [];

  const ids = noteIds.map((n) => n.id);
  const allTags = await db
    .select({ tag: stockTags.tag })
    .from(stockTags)
    .where(inArray(stockTags.stockId, ids))
    .orderBy(asc(stockTags.tag));

  return [...new Set(allTags.map((t) => t.tag))];
}

function formatTimestampForPromotion(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}`;
}

export async function promotePost(postId: string, title?: string) {
  const profile = await getAuthProfile();

  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) return { error: "Post not found" };
  if (post.isPromoted) return { success: true, skipped: true };

  const postTitle =
    title?.trim() || post.content.slice(0, 30).replace(/\n/g, " ");

  await db.insert(stocks).values({
    status: "inbox",
    title: postTitle,
    content: post.content,
    sourcePostIds: JSON.stringify([postId]),
    sourceChannelId: post.channelId,
    authorId: profile.id,
  });

  await db.update(posts).set({ isPromoted: true }).where(eq(posts.id, postId));

  revalidatePath("/");
  return { success: true };
}

export async function promoteThread(postId: string, title?: string) {
  const profile = await getAuthProfile();

  const [parentPost] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId));
  if (!parentPost) return { error: "Post not found" };

  const replies = await db
    .select()
    .from(postReplies)
    .where(eq(postReplies.postId, postId))
    .orderBy(asc(postReplies.createdAt));

  const allMessages = [parentPost, ...replies];

  const contentParts = allMessages.map((msg) => {
    const ts = formatTimestampForPromotion(msg.createdAt);
    return `**[${ts}]**\n${msg.content}`;
  });

  const combinedContent = contentParts.join("\n\n---\n\n");
  const allIds = allMessages.map((m) => m.id);
  const postTitle =
    title?.trim() || parentPost.content.slice(0, 30).replace(/\n/g, " ");

  await db.insert(stocks).values({
    status: "inbox",
    title: postTitle,
    content: combinedContent,
    sourcePostIds: JSON.stringify(allIds),
    sourceChannelId: parentPost.channelId,
    authorId: profile.id,
  });

  await db
    .update(posts)
    .set({ isPromoted: true })
    .where(eq(posts.id, parentPost.id));

  revalidatePath("/");
  return { success: true };
}

export async function promoteMultiple(postIds: string[], title?: string) {
  const profile = await getAuthProfile();

  if (postIds.length === 0) return { error: "No posts selected" };

  const selectedPosts = await db
    .select()
    .from(posts)
    .where(inArray(posts.id, postIds))
    .orderBy(asc(posts.createdAt));

  const nonPromoted = selectedPosts.filter((p) => !p.isPromoted);
  if (nonPromoted.length === 0) return { success: true, skipped: true };

  const contentParts = nonPromoted.map((post) => {
    const ts = formatTimestampForPromotion(post.createdAt);
    return `**[${ts}]**\n${post.content}`;
  });

  const combinedContent = contentParts.join("\n\n---\n\n");
  const postTitle =
    title?.trim() || nonPromoted[0].content.slice(0, 30).replace(/\n/g, " ");

  const channelId = nonPromoted[0].channelId;

  await db.insert(stocks).values({
    status: "inbox",
    title: postTitle,
    content: combinedContent,
    sourcePostIds: JSON.stringify(nonPromoted.map((p) => p.id)),
    sourceChannelId: channelId,
    authorId: profile.id,
  });

  const idsToUpdate = nonPromoted.map((p) => p.id);
  await db
    .update(posts)
    .set({ isPromoted: true })
    .where(inArray(posts.id, idsToUpdate));

  revalidatePath("/");
  return { success: true };
}

export async function getInboxItems(): Promise<NoteWithTags[]> {
  const profile = await getCachedAuthProfile();

  const items = await db
    .select()
    .from(stocks)
    .where(and(eq(stocks.status, "inbox"), eq(stocks.authorId, profile.id)))
    .orderBy(desc(stocks.createdAt));

  return items.map((item) => ({ ...item, tags: [] }));
}

export async function getInboxCount(): Promise<number> {
  const profile = await getCachedAuthProfile();

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(stocks)
    .where(and(eq(stocks.status, "inbox"), eq(stocks.authorId, profile.id)));

  return result?.count ?? 0;
}

export async function moveToNote(
  stockId: string,
  group?: string,
  tags?: string[],
) {
  await getAuthProfile();

  await db
    .update(stocks)
    .set({
      status: "note",
      group: group?.trim() || null,
    })
    .where(eq(stocks.id, stockId));

  if (tags && tags.length > 0) {
    const uniqueTags = [
      ...new Set(tags.map((t) => t.toLowerCase().trim()).filter(Boolean)),
    ];
    if (uniqueTags.length > 0) {
      await db.insert(stockTags).values(
        uniqueTags.map((tag) => ({
          stockId,
          tag,
        })),
      );
    }
  }

  revalidatePath("/");
  return { success: true };
}

export async function mergeIntoNote(stockId: string, targetNoteId: string) {
  await getAuthProfile();

  const [inboxResults, targetResults] = await Promise.all([
    db.select().from(stocks).where(eq(stocks.id, stockId)),
    db.select().from(stocks).where(eq(stocks.id, targetNoteId)),
  ]);
  const inboxItem = inboxResults[0];
  const targetNote = targetResults[0];
  if (!inboxItem) return { error: "Inbox item not found" };
  if (!targetNote) return { error: "Target note not found" };

  const mergedContent = targetNote.content + "\n\n---\n\n" + inboxItem.content;

  await db
    .update(stocks)
    .set({ content: mergedContent })
    .where(eq(stocks.id, targetNoteId));

  await db.delete(stocks).where(eq(stocks.id, stockId));

  revalidatePath("/");
  return { success: true };
}

export async function moveMultipleToNote(
  ids: string[],
  group?: string,
  tags?: string[],
) {
  await getAuthProfile();

  if (ids.length === 0) return { error: "No items selected" };

  await db
    .update(stocks)
    .set({
      status: "note",
      group: group?.trim() || null,
    })
    .where(inArray(stocks.id, ids));

  if (tags && tags.length > 0) {
    const uniqueTags = [
      ...new Set(tags.map((t) => t.toLowerCase().trim()).filter(Boolean)),
    ];
    if (uniqueTags.length > 0) {
      const tagValues = ids.flatMap((id) =>
        uniqueTags.map((tag) => ({ stockId: id, tag })),
      );
      await db.insert(stockTags).values(tagValues);
    }
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteStock(id: string) {
  await getAuthProfile();

  await db.delete(stocks).where(eq(stocks.id, id));

  revalidatePath("/");
  return { success: true };
}

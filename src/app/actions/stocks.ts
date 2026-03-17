"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { stocks, stockTags } from "@/db/schema";
import { eq, and, isNotNull, asc, desc, inArray } from "drizzle-orm";
import { getAuthProfile } from "./auth";
import { getCachedAuthProfile } from "@/lib/cached-auth";

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

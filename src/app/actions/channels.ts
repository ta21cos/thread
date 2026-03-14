"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { channels } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getAuthProfile } from "./auth";

export async function getChannels() {
  const profile = await getAuthProfile();
  return db
    .select()
    .from(channels)
    .where(eq(channels.authorId, profile.id))
    .orderBy(asc(channels.sortOrder), asc(channels.name));
}

export async function getChannel(id: string) {
  const profile = await getAuthProfile();
  const [channel] = await db
    .select()
    .from(channels)
    .where(eq(channels.id, id));

  if (!channel || channel.authorId !== profile.id) {
    return null;
  }

  return channel;
}

export async function createChannel(formData: FormData) {
  const profile = await getAuthProfile();
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  if (!name?.trim()) {
    return { error: "Channel name is required" };
  }

  const existing = await db
    .select()
    .from(channels)
    .where(eq(channels.authorId, profile.id));

  const maxSortOrder = existing.reduce(
    (max, ch) => Math.max(max, ch.sortOrder),
    -1,
  );

  await db.insert(channels).values({
    name: name.trim(),
    description: description?.trim() || null,
    sortOrder: maxSortOrder + 1,
    authorId: profile.id,
  });

  revalidatePath("/");
  return { success: true };
}

export async function updateChannel(id: string, formData: FormData) {
  await getAuthProfile();
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  if (!name?.trim()) {
    return { error: "Channel name is required" };
  }

  await db
    .update(channels)
    .set({
      name: name.trim(),
      description: description?.trim() || null,
    })
    .where(eq(channels.id, id));

  revalidatePath("/");
  return { success: true };
}

export async function deleteChannel(id: string) {
  await getAuthProfile();

  await db.delete(channels).where(eq(channels.id, id));

  revalidatePath("/");
  return { success: true };
}

export async function reorderChannels(orderedIds: string[]) {
  await getAuthProfile();

  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(channels)
        .set({ sortOrder: i })
        .where(eq(channels.id, orderedIds[i]));
    }
  });

  revalidatePath("/");
  return { success: true };
}

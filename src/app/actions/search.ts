"use server";

import { db } from "@/db";
import { posts, postReplies, channels } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { getAuthProfile } from "./auth";

export type SearchResult = {
  id: string;
  content: string;
  channelId: string;
  channelName: string;
  createdAt: Date;
  type: "post" | "reply";
  similarity: number;
};

export async function searchPosts(query: string): Promise<SearchResult[]> {
  const profile = await getAuthProfile();

  if (!query?.trim()) return [];

  const trimmed = query.trim();

  const postResults = await db
    .select({
      id: posts.id,
      content: posts.content,
      channelId: posts.channelId,
      channelName: channels.name,
      createdAt: posts.createdAt,
      similarity: sql<number>`similarity(${posts.content}, ${trimmed})`,
    })
    .from(posts)
    .innerJoin(channels, eq(posts.channelId, channels.id))
    .where(
      sql`${posts.authorId} = ${profile.id} AND ${posts.content} % ${trimmed}`,
    )
    .orderBy(sql`similarity(${posts.content}, ${trimmed}) DESC`)
    .limit(20);

  const replyResults = await db
    .select({
      id: postReplies.id,
      content: postReplies.content,
      channelId: channels.id,
      channelName: channels.name,
      createdAt: postReplies.createdAt,
      similarity:
        sql<number>`similarity(${postReplies.content}, ${trimmed})`,
    })
    .from(postReplies)
    .innerJoin(posts, eq(postReplies.postId, posts.id))
    .innerJoin(channels, eq(posts.channelId, channels.id))
    .where(
      sql`${postReplies.authorId} = ${profile.id} AND ${postReplies.content} % ${trimmed}`,
    )
    .orderBy(sql`similarity(${postReplies.content}, ${trimmed}) DESC`)
    .limit(20);

  const results: SearchResult[] = [
    ...postResults.map((r) => ({ ...r, type: "post" as const })),
    ...replyResults.map((r) => ({ ...r, type: "reply" as const })),
  ];

  results.sort((a, b) => b.similarity - a.similarity);

  return results.slice(0, 20);
}

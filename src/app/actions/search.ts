"use server";

import { db } from "@/db";
import { posts, postReplies, channels, stocks } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { getAuthProfile } from "./auth";
import { getCachedAuthProfile } from "@/lib/cached-auth";

export type SearchResult = {
  id: string;
  content: string;
  channelId: string;
  channelName: string;
  createdAt: Date;
  type: "post" | "reply" | "note";
  similarity: number;
  group?: string;
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
      similarity: sql<number>`similarity(${postReplies.content}, ${trimmed})`,
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

export async function searchStocks(query: string): Promise<SearchResult[]> {
  const profile = await getCachedAuthProfile();

  if (!query?.trim()) return [];

  const trimmed = query.trim();

  const stockResults = await db
    .select({
      id: stocks.id,
      title: stocks.title,
      group: stocks.group,
      createdAt: stocks.createdAt,
      titleSimilarity: sql<number>`similarity(${stocks.title}, ${trimmed})`,
      contentSimilarity: sql<number>`similarity(${stocks.content}, ${trimmed})`,
    })
    .from(stocks)
    .where(
      sql`${stocks.authorId} = ${profile.id} AND (${stocks.title} % ${trimmed} OR ${stocks.content} % ${trimmed})`,
    )
    .orderBy(
      sql`GREATEST(similarity(${stocks.title}, ${trimmed}), similarity(${stocks.content}, ${trimmed})) DESC`,
    )
    .limit(20);

  return stockResults.map((r) => ({
    id: r.id,
    content: r.title,
    channelId: "",
    channelName: "",
    createdAt: r.createdAt,
    type: "note" as const,
    similarity: Math.max(r.titleSimilarity, r.contentSimilarity),
    group: r.group ?? undefined,
  }));
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  const [postResults, stockResults] = await Promise.all([
    searchPosts(query),
    searchStocks(query),
  ]);

  const merged = [...postResults, ...stockResults];
  merged.sort((a, b) => b.similarity - a.similarity);

  return merged.slice(0, 20);
}

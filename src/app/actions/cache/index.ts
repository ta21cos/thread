'use server';

import { revalidateTag } from 'next/cache';

export type CacheTag = 'memos' | 'threads' | 'dashboard' | 'users';

export async function invalidateCache(tags: CacheTag | CacheTag[]) {
  const tagsArray = Array.isArray(tags) ? tags : [tags];

  for (const tag of tagsArray) {
    revalidateTag(tag);
  }
}

export async function invalidateAllMemoData() {
  await invalidateCache(['memos', 'threads', 'dashboard']);
}

export async function invalidateMemoCache() {
  await invalidateCache('memos');
}

export async function invalidateThreadCache() {
  await invalidateCache('threads');
}

export async function invalidateDashboardCache() {
  await invalidateCache('dashboard');
}

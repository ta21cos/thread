import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../hooks/useApiClient';
import type { Bookmark } from '../../../shared/types';

// NOTE: Query keys for cache management
export const bookmarkKeys = {
  all: ['bookmarks'] as const,
  lists: () => [...bookmarkKeys.all, 'list'] as const,
  check: (noteId: string) => [...bookmarkKeys.all, 'check', noteId] as const,
};

interface BookmarkListResponse {
  bookmarks: Bookmark[];
}

// NOTE: Fetch all bookmarks for current user
export const useBookmarks = (limit?: number) => {
  const { get } = useApiClient();

  return useQuery({
    queryKey: bookmarkKeys.lists(),
    queryFn: async () => {
      const response = await get<BookmarkListResponse>('/bookmarks', limit ? { limit } : undefined);
      return response.bookmarks;
    },
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

// NOTE: Check if a note is bookmarked
export const useIsBookmarked = (noteId: string | undefined) => {
  const { get } = useApiClient();

  return useQuery({
    queryKey: bookmarkKeys.check(noteId!),
    queryFn: async () => {
      const response = await get<{ bookmarked: boolean }>(`/bookmarks/${noteId}`);
      return response.bookmarked;
    },
    enabled: !!noteId,
    staleTime: 1000 * 60 * 1,
  });
};

// NOTE: Toggle bookmark on a note
export const useToggleBookmark = () => {
  const queryClient = useQueryClient();
  const { post } = useApiClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const response = await post<{ bookmarked: boolean }>(`/bookmarks/${noteId}`, {});
      return { noteId, ...response };
    },
    onSuccess: ({ noteId, bookmarked }) => {
      // Update the check query for this note
      queryClient.setQueryData(bookmarkKeys.check(noteId), bookmarked);
      // Invalidate the list
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
    },
  });
};

// NOTE: Remove bookmark from a note
export const useRemoveBookmark = () => {
  const queryClient = useQueryClient();
  const { delete: del } = useApiClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      await del(`/bookmarks/${noteId}`);
      return noteId;
    },
    onSuccess: (noteId) => {
      queryClient.setQueryData(bookmarkKeys.check(noteId), false);
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
    },
  });
};

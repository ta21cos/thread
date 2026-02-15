import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../hooks/useApiClient';
import type { ScratchPad, Note } from '../../../shared/types';

// NOTE: Query keys for cache management
export const scratchPadKeys = {
  all: ['scratchPad'] as const,
  detail: (channelId: string | null) => [...scratchPadKeys.all, channelId ?? 'global'] as const,
};

// NOTE: Fetch scratch pad for current user
export const useScratchPad = (channelId?: string | null) => {
  const { get } = useApiClient();

  return useQuery({
    queryKey: scratchPadKeys.detail(channelId ?? null),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (channelId) params.channelId = channelId;
      const response = await get<ScratchPad>('/scratch-pad', params);
      return response;
    },
    staleTime: 1000 * 30,
  });
};

// NOTE: Update scratch pad content
export const useUpdateScratchPad = () => {
  const queryClient = useQueryClient();
  const { put } = useApiClient();

  return useMutation({
    mutationFn: async ({ content, channelId }: { content: string; channelId?: string | null }) => {
      const response = await put<ScratchPad>('/scratch-pad', {
        content,
        channelId: channelId ?? null,
      });
      return response;
    },
    onSuccess: (data, { channelId }) => {
      queryClient.setQueryData(scratchPadKeys.detail(channelId ?? null), data);
    },
  });
};

// NOTE: Convert scratch pad to note
export const useConvertScratchPad = () => {
  const queryClient = useQueryClient();
  const { post } = useApiClient();

  return useMutation({
    mutationFn: async (channelId?: string | null) => {
      const response = await post<Note>('/scratch-pad/convert', {
        channelId: channelId ?? null,
      });
      return response;
    },
    onSuccess: (_data, channelId) => {
      queryClient.invalidateQueries({
        queryKey: scratchPadKeys.detail(channelId ?? null),
      });
      // NOTE: Also invalidate notes list since a new note was created
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

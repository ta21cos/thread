import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../hooks/useApiClient';
import type { ScratchPad, Note } from '../../../shared/types';

// NOTE: Query keys for cache management
export const scratchPadKeys = {
  all: ['scratchPad'] as const,
  detail: (channelId: string) => [...scratchPadKeys.all, channelId] as const,
};

// NOTE: Fetch scratch pad for current user
export const useScratchPad = (channelId: string | undefined) => {
  const { get } = useApiClient();

  return useQuery({
    queryKey: scratchPadKeys.detail(channelId!),
    queryFn: async () => {
      const response = await get<ScratchPad>('/scratch-pad', { channelId: channelId! });
      return response;
    },
    enabled: !!channelId,
    staleTime: 1000 * 30,
  });
};

// NOTE: Update scratch pad content
export const useUpdateScratchPad = () => {
  const queryClient = useQueryClient();
  const { put } = useApiClient();

  return useMutation({
    mutationFn: async ({ content, channelId }: { content: string; channelId: string }) => {
      const response = await put<ScratchPad>('/scratch-pad', {
        content,
        channelId,
      });
      return response;
    },
    onSuccess: (data, { channelId }) => {
      queryClient.setQueryData(scratchPadKeys.detail(channelId), data);
    },
  });
};

// NOTE: Convert scratch pad to note
export const useConvertScratchPad = () => {
  const queryClient = useQueryClient();
  const { post } = useApiClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const response = await post<Note>('/scratch-pad/convert', {
        channelId,
      });
      return response;
    },
    onSuccess: (_data, channelId) => {
      queryClient.invalidateQueries({
        queryKey: scratchPadKeys.detail(channelId),
      });
      // NOTE: Also invalidate notes list since a new note was created
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

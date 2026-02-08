import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../hooks/useApiClient';
import type { Channel, ChannelListResponse } from '../../../shared/types';

// NOTE: Query keys for cache management
export const channelKeys = {
  all: ['channels'] as const,
  lists: () => [...channelKeys.all, 'list'] as const,
  detail: (id: string) => [...channelKeys.all, 'detail', id] as const,
};

interface CreateChannelDto {
  name: string;
  color?: string;
  icon?: string;
}

interface UpdateChannelDto {
  name?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

// NOTE: Fetch all channels for current user
export const useChannels = () => {
  const { get } = useApiClient();

  return useQuery({
    queryKey: channelKeys.lists(),
    queryFn: async () => {
      const response = await get<ChannelListResponse>('/channels');
      return response.channels;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// NOTE: Fetch single channel
export const useChannel = (id: string | undefined) => {
  const { get } = useApiClient();

  return useQuery({
    queryKey: channelKeys.detail(id!),
    queryFn: async () => {
      const response = await get<Channel>(`/channels/${id}`);
      return response;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

// NOTE: Create new channel
export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  const { post } = useApiClient();

  return useMutation({
    mutationFn: async (data: CreateChannelDto) => {
      const response = await post<Channel>('/channels', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
    },
  });
};

// NOTE: Update existing channel
export const useUpdateChannel = () => {
  const queryClient = useQueryClient();
  const { put } = useApiClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & UpdateChannelDto) => {
      const response = await put<Channel>(`/channels/${id}`, data);
      return response;
    },
    onSuccess: (updatedChannel) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      queryClient.setQueryData(channelKeys.detail(updatedChannel.id), updatedChannel);
    },
  });
};

// NOTE: Delete channel
export const useDeleteChannel = () => {
  const queryClient = useQueryClient();
  const { delete: del } = useApiClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await del(`/channels/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      queryClient.removeQueries({ queryKey: channelKeys.detail(deletedId) });
    },
  });
};

// NOTE: Ensure default channel exists
export const useEnsureDefaultChannel = () => {
  const queryClient = useQueryClient();
  const { post } = useApiClient();

  return useMutation({
    mutationFn: async () => {
      const response = await post<Channel>('/channels/default', {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
    },
  });
};

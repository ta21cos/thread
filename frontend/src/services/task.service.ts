import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../hooks/useApiClient';
import type { Task } from '../../../shared/types';

// NOTE: Query keys for cache management
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (includeCompleted: boolean) => [...taskKeys.lists(), { includeCompleted }] as const,
};

interface TaskListResponse {
  tasks: Task[];
}

// NOTE: Fetch tasks for current user
export const useTasks = (includeCompleted: boolean = true) => {
  const { get } = useApiClient();

  return useQuery({
    queryKey: taskKeys.list(includeCompleted),
    queryFn: async () => {
      const response = await get<TaskListResponse>('/tasks', { includeCompleted });
      return response.tasks;
    },
    staleTime: 1000 * 60 * 1,
  });
};

// NOTE: Toggle task completion status with optimistic update
export const useToggleTask = () => {
  const queryClient = useQueryClient();
  const { patch } = useApiClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await patch<Task>(`/tasks/${taskId}/toggle`, {});
      return response;
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const previousLists = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      });

      // NOTE: Optimistically toggle task completion
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.lists() }, (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === taskId
            ? {
                ...task,
                isCompleted: !task.isCompleted,
                completedAt: task.isCompleted ? null : new Date().toISOString(),
              }
            : task
        );
      });

      return { previousLists };
    },
    onError: (_err, _taskId, context) => {
      if (context?.previousLists) {
        for (const [queryKey, data] of context.previousLists) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

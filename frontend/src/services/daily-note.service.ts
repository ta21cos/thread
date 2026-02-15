import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../hooks/useApiClient';
import type { DailyNote, Note, Template } from '../../../shared/types';

// NOTE: Query keys for cache management
export const dailyNoteKeys = {
  all: ['dailyNotes'] as const,
  detail: (date: string) => [...dailyNoteKeys.all, 'detail', date] as const,
  calendar: (year: number, month: number) =>
    [...dailyNoteKeys.all, 'calendar', year, month] as const,
  templates: () => [...dailyNoteKeys.all, 'templates'] as const,
};

interface DailyNoteResponse {
  dailyNote: DailyNote;
  note: Note;
}

interface CalendarEntry {
  date: string;
  hasNote: boolean;
}

interface CalendarResponse {
  entries: CalendarEntry[];
}

interface TemplateListResponse {
  templates: Template[];
}

// NOTE: Fetch or create daily note for a date
export const useDailyNote = (date: string | undefined, templateId?: string) => {
  const { get } = useApiClient();

  return useQuery({
    queryKey: dailyNoteKeys.detail(date!),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (templateId) params.templateId = templateId;
      const response = await get<DailyNoteResponse>(`/daily-notes/${date}`, params);
      return response;
    },
    enabled: !!date,
    staleTime: 1000 * 60 * 5,
  });
};

// NOTE: Fetch calendar entries for a month
export const useCalendar = (year: number, month: number) => {
  const { get } = useApiClient();

  return useQuery({
    queryKey: dailyNoteKeys.calendar(year, month),
    queryFn: async () => {
      const response = await get<CalendarResponse>(`/daily-notes/calendar/${year}/${month}`);
      return response.entries;
    },
    staleTime: 1000 * 60 * 5,
  });
};

// NOTE: Fetch all templates
export const useTemplates = () => {
  const { get } = useApiClient();

  return useQuery({
    queryKey: dailyNoteKeys.templates(),
    queryFn: async () => {
      const response = await get<TemplateListResponse>('/daily-notes/templates');
      return response.templates;
    },
    staleTime: 1000 * 60 * 5,
  });
};

// NOTE: Create a new template
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  const { post } = useApiClient();

  return useMutation({
    mutationFn: async (data: { name: string; content: string; isDefault?: boolean }) => {
      const response = await post<Template>('/daily-notes/templates', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyNoteKeys.templates() });
    },
  });
};

// NOTE: Update a template
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  const { put } = useApiClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      content?: string;
      isDefault?: boolean;
    }) => {
      const response = await put<Template>(`/daily-notes/templates/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyNoteKeys.templates() });
    },
  });
};

// NOTE: Delete a template
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  const { delete: del } = useApiClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await del(`/daily-notes/templates/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyNoteKeys.templates() });
    },
  });
};

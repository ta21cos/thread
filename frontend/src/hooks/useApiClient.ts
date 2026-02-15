import { useAuth } from '@clerk/clerk-react';
import { ApiError } from '../services/api.client';

const isE2ETest = import.meta.env.VITE_E2E_TEST === 'true';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

interface ErrorResponse {
  message?: string;
}

const isErrorResponse = (value: unknown): value is ErrorResponse => {
  return typeof value === 'object' && value !== null && 'message' in value;
};

function createUrl(base: string, path: string): URL {
  return new URL([base.replace(/\/+$/, ''), path.replace(/^\/+/, '')].join('/'), base);
}

// NOTE: Stub for E2E test mode when Clerk is not available
const useAuthStub = () => ({
  getToken: async () => null,
});

export const useApiClient = () => {
  const { getToken } = isE2ETest ? useAuthStub() : useAuth();

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_API_ENDPOINT}/api`;

  // NOTE: Build URL with query parameters
  const buildUrl = (
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string => {
    const url = createUrl(API_BASE_URL, path);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  };

  // NOTE: Generic fetch wrapper with authentication
  const apiFetch = async <T>(
    endpoint: string,
    { params, ...options }: FetchOptions = {}
  ): Promise<T> => {
    const token = await getToken();
    const url = buildUrl(endpoint, params);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // NOTE: Add Authorization header with Clerk token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      headers,
      ...options,
    });

    // NOTE: Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const data: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = isErrorResponse(data)
        ? data.message
        : `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(
        message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data
      );
    }

    return data as T;
  };

  return {
    get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
      apiFetch<T>(endpoint, { method: 'GET', params }),

    post: <T>(endpoint: string, body?: unknown) =>
      apiFetch<T>(endpoint, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),

    put: <T>(endpoint: string, body?: unknown) =>
      apiFetch<T>(endpoint, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      }),

    patch: <T>(endpoint: string, body?: unknown) =>
      apiFetch<T>(endpoint, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      }),

    delete: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'DELETE' }),
  };
};

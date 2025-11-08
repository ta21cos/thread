// NOTE: API client with fetch wrapper and error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

// NOTE: Detect if running in Electron
const isElectron = typeof window !== 'undefined' &&
  (window as typeof window & { electron?: { platform: string } }).electron !== undefined

// NOTE: API_BASE_URL is always an absolute URL (http://... or https://...)
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_ENDPOINT
  ? `${import.meta.env.VITE_BACKEND_API_ENDPOINT}/api`
  : 'http://localhost:3000/api';

// NOTE: Build URL with query parameters
const buildUrl = (
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string => {
  // NOTE: path is always absolute (starts with http), so base URL is not needed
  const url = new URL(path);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
};

// NOTE: Generic fetch wrapper with error handling
export const apiFetch = async <T>(
  endpoint: string,
  { params, ...options }: FetchOptions = {}
): Promise<T> => {
  const url = buildUrl(`${API_BASE_URL}${endpoint}`, params);

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  // NOTE: Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      data
    );
  }

  return data as T;
};

// NOTE: Convenience methods for common HTTP verbs
export const api = {
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

  delete: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'DELETE' }),
};

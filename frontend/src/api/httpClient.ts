import { config } from '@/config/env';
import { ApiError, type ApiResponse } from '@/types/api';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
}

const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

function buildUrl(endpoint: string, query?: RequestOptions['query']): string {
  const base = config.apiBaseUrl.replace(/\/+$/, '');
  const path = endpoint.replace(/^\/+/, '');
  const url = base ? `${base}/${path}` : `/${path}`;

  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, headers, skipAuth, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((headers as Record<string, string>) || {}),
  };

  if (!skipAuth) {
    const token = tokenStorage.get();
    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const init: RequestInit = {
    ...rest,
    headers: finalHeaders,
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const url = buildUrl(endpoint, query);

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : 'אירעה שגיאת רשת',
      0,
    );
  }

  if (response.status === 401 && !skipAuth) {
    tokenStorage.clear();
    if (unauthorizedHandler) {
      unauthorizedHandler();
    }
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const apiPayload = payload as ApiResponse<unknown> | null;
    throw new ApiError(
      apiPayload?.message || `הבקשה נכשלה (${response.status})`,
      response.status,
      apiPayload?.errors ?? undefined,
    );
  }

  const apiResponse = payload as ApiResponse<T>;
  if (apiResponse && typeof apiResponse === 'object' && 'success' in apiResponse) {
    if (!apiResponse.success) {
      throw new ApiError(
        apiResponse.message || 'הבקשה נכשלה',
        response.status,
        apiResponse.errors ?? undefined,
      );
    }
    return apiResponse.data as T;
  }

  return payload as T;
}

export const httpClient = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),
  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

import type { ApiFailure, ApiFieldError, PaginationMeta } from '../types/api';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000/api';

const TOKEN_STORAGE_KEY = 'mini-erp-crm.token';

/**
 * Error carrying everything the UI needs to react: the HTTP status, the
 * machine readable code (e.g. INSUFFICIENT_STOCK) and per-field validation
 * messages that forms map onto their inputs.
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: ApiFieldError[];
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.fieldErrors = Array.isArray(details) ? (details as ApiFieldError[]) : [];
  }

  /** `{ mobile: 'Enter a valid 10 digit Indian mobile number' }` */
  get fieldMessages(): Record<string, string> {
    return Object.fromEntries(this.fieldErrors.map((error) => [error.field, error.message]));
  }
}

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_STORAGE_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_STORAGE_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_STORAGE_KEY),
};

let onUnauthorized: (() => void) | null = null;

/** Lets the auth provider sign the user out when a token stops being accepted. */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const buildQuery = (params: QueryParams = {}) => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Skip the automatic sign-out on 401 (used by the login request itself). */
  skipAuthRedirect?: boolean;
}

export interface ApiResult<T> {
  data: T;
  meta?: PaginationMeta;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { method = 'GET', body, signal, skipAuthRedirect } = options;
  const token = tokenStorage.get();

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    throw new ApiRequestError(
      0,
      'NETWORK_ERROR',
      'Could not reach the server. Check your connection and try again.',
    );
  }

  if (response.status === 204) {
    return { data: undefined as T };
  }

  const payload = (await response.json().catch(() => null)) as
    | ApiResult<T>
    | ApiFailure
    | null;

  if (!response.ok || !payload || 'error' in payload) {
    const failure = payload && 'error' in payload ? payload.error : null;

    if (response.status === 401 && !skipAuthRedirect) {
      onUnauthorized?.();
    }

    throw new ApiRequestError(
      response.status,
      failure?.code ?? 'UNEXPECTED_ERROR',
      failure?.message ?? 'Something went wrong. Please try again.',
      failure?.details,
    );
  }

  return payload;
}

export const api = {
  get: <T>(path: string, params?: QueryParams, signal?: AbortSignal) =>
    apiRequest<T>(`${path}${buildQuery(params)}`, { signal }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
};

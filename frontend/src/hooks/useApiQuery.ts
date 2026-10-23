import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError, api, type QueryParams } from '../lib/api';
import type { PaginationMeta } from '../types/api';

interface QueryState<T> {
  data: T | null;
  meta: PaginationMeta | undefined;
  isLoading: boolean;
  error: ApiRequestError | null;
}

export interface UseApiQueryResult<T> extends QueryState<T> {
  /** Re-runs the request, e.g. after a mutation elsewhere on the page. */
  refetch: () => void;
}

/**
 * Loads a GET endpoint and keeps track of loading/error state.
 *
 * `params` is serialised into the dependency key so callers can pass an inline
 * object without triggering an infinite refetch loop.
 */
export function useApiQuery<T>(
  path: string | null,
  params?: QueryParams,
  options: { enabled?: boolean } = {},
): UseApiQueryResult<T> {
  const { enabled = true } = options;
  const paramsKey = JSON.stringify(params ?? {});

  const [state, setState] = useState<QueryState<T>>({
    data: null,
    meta: undefined,
    isLoading: Boolean(path) && enabled,
    error: null,
  });

  const [reloadToken, setReloadToken] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!path || !enabled) {
      setState((current) => ({ ...current, isLoading: false }));
      return;
    }

    const controller = new AbortController();

    setState((current) => ({ ...current, isLoading: true, error: null }));

    api
      .get<T>(path, JSON.parse(paramsKey) as QueryParams, controller.signal)
      .then((result) => {
        if (controller.signal.aborted || !isMounted.current) return;
        setState({ data: result.data, meta: result.meta, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || !isMounted.current) return;
        if (error instanceof DOMException && error.name === 'AbortError') return;

        setState({
          data: null,
          meta: undefined,
          isLoading: false,
          error:
            error instanceof ApiRequestError
              ? error
              : new ApiRequestError(0, 'UNEXPECTED_ERROR', 'Something went wrong.'),
        });
      });

    return () => controller.abort();
  }, [path, paramsKey, enabled, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { ...state, refetch };
}

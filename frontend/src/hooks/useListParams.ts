import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type ListParamPatch = Record<string, string | number | boolean | null | undefined>;

/**
 * Keeps list filters in the URL so a filtered view is shareable, survives a
 * refresh and can be linked to directly (the sidebar does exactly that with
 * `?lowStock=true` and `?status=DRAFT`).
 *
 * Changing any filter resets to page 1, which is almost always what the user
 * expects — an explicit `page` in the patch wins.
 */
export function useListParams<T extends Record<string, string>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => {
    const result = { ...defaults } as Record<string, string>;

    for (const key of Object.keys(defaults)) {
      const value = searchParams.get(key);
      if (value !== null) result[key] = value;
    }

    return result as T;
  }, [searchParams, defaults]);

  const setValues = useCallback(
    (patch: ListParamPatch) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);

          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === null || value === '' || value === false) {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }

          if (!('page' in patch)) next.delete('page');

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const reset = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams]);

  /** True when anything beyond the defaults is applied. */
  const hasFilters = useMemo(
    () => [...searchParams.keys()].some((key) => key !== 'page'),
    [searchParams],
  );

  return { values, setValues, reset, hasFilters };
}

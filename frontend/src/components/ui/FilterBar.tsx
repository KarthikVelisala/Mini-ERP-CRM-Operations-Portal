import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { SearchInput } from './Form';

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
  onClear?: () => void;
  hasFilters?: boolean;
  className?: string;
}

/**
 * The toolbar that sits above every list: a rounded search field, the module's
 * filter pills and a clear action. Typing is debounced so the API is not called
 * on every keystroke.
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  children,
  onClear,
  hasFilters,
  className,
}: FilterBarProps) {
  const [term, setTerm] = useState(searchValue);
  const debounced = useDebouncedValue(term, 350);

  // Keep the input in step when the URL changes from elsewhere (e.g. a nav link).
  useEffect(() => {
    setTerm(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (debounced !== searchValue) onSearchChange(debounced);
    // `onSearchChange` is stable per render of the page; searchValue guards the loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-2xl border border-white/60 bg-white/70 p-2 backdrop-blur-sm',
        className,
      )}
    >
      <SearchInput
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        className="min-w-[12rem] flex-1"
      />

      {children}

      {hasFilters && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      ) : null}
    </div>
  );
}

interface TogglePillProps {
  isActive: boolean;
  onToggle: () => void;
  children: ReactNode;
  count?: number;
}

/** Binary filter rendered as a pill, matching the reference's control style. */
export function TogglePill({ isActive, onToggle, children, count }: TogglePillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isActive}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
        isActive
          ? 'border-accent bg-accent text-white'
          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
      )}
    >
      {children}
      {count !== undefined && count > 0 ? (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
            isActive ? 'bg-white/25' : 'bg-gray-100 text-gray-600',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

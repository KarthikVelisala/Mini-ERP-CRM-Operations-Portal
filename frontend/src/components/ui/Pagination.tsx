import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatNumber } from '../../lib/format';
import type { PaginationMeta } from '../../types/api';

interface PaginationProps {
  meta: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ meta, onPageChange, className }: PaginationProps) {
  if (!meta || meta.total === 0) return null;

  const { page, pageSize, total, totalPages } = meta;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  const pages = pageNumbers(page, totalPages);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/70 pt-3',
        className,
      )}
    >
      <p className="text-[11px] text-gray-500">
        Showing <span className="font-semibold text-gray-700">{formatNumber(first)}</span>–
        <span className="font-semibold text-gray-700">{formatNumber(last)}</span> of{' '}
        <span className="font-semibold text-gray-700">{formatNumber(total)}</span>
      </p>

      <div className="flex items-center gap-1">
        <PageButton
          label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </PageButton>

        {pages.map((entry, index) =>
          entry === 'gap' ? (
            <span key={`gap-${index}`} className="px-1 text-[11px] text-gray-400">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? 'page' : undefined}
              className={cn(
                'h-7 min-w-7 rounded-full px-2 text-[11px] font-semibold transition',
                entry === page
                  ? 'bg-black text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              {entry}
            </button>
          ),
        )}

        <PageButton
          label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** Windowed page list: 1 … 4 5 6 … 20 */
function pageNumbers(current: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);

  const result: Array<number | 'gap'> = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push('gap');
    result.push(page);
  });

  return result;
}

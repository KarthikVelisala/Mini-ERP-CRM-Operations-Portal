import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { EmptyState, TableSkeleton } from './States';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Tailwind width/alignment classes applied to both header and cells. */
  className?: string;
  align?: 'left' | 'right' | 'center';
  /** Hidden below the given breakpoint to keep narrow screens readable. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
}

interface DataTableProps<T> {
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Rendered on narrow screens instead of the table. */
  renderCard?: (row: T) => ReactNode;
  className?: string;
}

const HIDE_BELOW: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
};

const ALIGN = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

/**
 * The list surface used by every module.
 *
 * It keeps the reference's compact typography (`text-xs`, muted uppercase-ish
 * header, hairline row separators) and falls back to stacked cards on small
 * screens so the same data stays usable on a phone.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  onRowClick,
  emptyTitle = 'Nothing to show yet',
  emptyDescription,
  emptyAction,
  renderCard,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton rows={6} columns={Math.min(columns.length, 6)} />;
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className={cn('min-w-0', className)}>
      {/* Card layout for narrow screens */}
      {renderCard ? (
        <div className="flex flex-col gap-2 md:hidden">
          {rows.map((row) => (
            <div
              key={rowKey(row)}
              className={cn(
                'rounded-2xl border border-gray-100 bg-white p-3 shadow-sm',
                onRowClick && 'cursor-pointer transition hover:border-gray-200 hover:shadow',
              )}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {renderCard(row)}
            </div>
          ))}
        </div>
      ) : null}

      <div className={cn('overflow-x-auto scrollbar-thin', renderCard && 'hidden md:block')}>
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-gray-200/70">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap px-3 pb-2 text-[11px] font-semibold text-gray-500',
                    ALIGN[column.align ?? 'left'],
                    column.hideBelow && HIDE_BELOW[column.hideBelow],
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-gray-100/80 last:border-0 transition',
                  onRowClick && 'cursor-pointer hover:bg-white/80',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-3 py-3 text-xs text-gray-700 align-middle',
                      ALIGN[column.align ?? 'left'],
                      column.hideBelow && HIDE_BELOW[column.hideBelow],
                      column.className,
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Primary cell treatment: a bold title with a muted supporting line. */
export function CellStack({
  title,
  subtitle,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="truncate text-xs font-semibold text-gray-800">{title}</div>
      {subtitle ? <div className="truncate text-[11px] text-gray-400">{subtitle}</div> : null}
    </div>
  );
}

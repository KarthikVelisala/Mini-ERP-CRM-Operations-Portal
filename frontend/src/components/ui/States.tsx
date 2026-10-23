import type { ReactNode } from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-black/5', className)} />;
}

/** Row-shaped placeholder that keeps table layouts stable while loading. */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 rounded-xl bg-white/60 px-3 py-3">
          {Array.from({ length: columns }, (_, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={cn('h-3', columnIndex === 0 ? 'w-1/4' : 'flex-1')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white/50 px-6 py-10 text-center',
        className,
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {icon ?? <Inbox className="h-5 w-5" />}
      </span>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {description ? <p className="max-w-sm text-xs text-gray-500">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50/70 px-6 py-8 text-center',
        className,
      )}
      role="alert"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500">
        <AlertCircle className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-red-700">{title}</p>
      <p className="max-w-md text-xs text-red-600">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-2" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Inline banner for form-level errors, keeping the message near the action. */
export function InlineError({ message, className }: { message: string; className?: string }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700',
        className,
      )}
      role="alert"
    >
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export function LoadingBlock({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-10 text-xs text-gray-500', className)}>
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-r-transparent" />
      {label}…
    </div>
  );
}

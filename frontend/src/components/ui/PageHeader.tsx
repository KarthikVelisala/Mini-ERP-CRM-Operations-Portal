import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
  className?: string;
}

/**
 * Page title treatment from the reference: a large, deliberately muted heading
 * with the actions aligned to the right.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  backTo,
  backLabel = 'Back',
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {backTo ? (
          <Link
            to={backTo}
            className="mb-1 inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 transition hover:text-black"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {backLabel}
          </Link>
        ) : null}
        <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-400 sm:text-3xl">
          {title}
        </h1>
        {subtitle ? <div className="mt-1 text-xs text-gray-500">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/**
 * The pill-shaped control cluster used above lists, mirroring the reference's
 * floating toolbar.
 */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-2xl border border-white/60 bg-white/70 p-2 backdrop-blur-sm sm:rounded-full sm:px-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

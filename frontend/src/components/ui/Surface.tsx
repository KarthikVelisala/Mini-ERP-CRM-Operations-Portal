import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * The three surface levels of the design system, taken from the UI reference:
 *
 * - `Panel`   translucent glass sitting on the warm shell (bg-white/40)
 * - `Card`    solid white card with a hairline border and soft shadow
 * - `InkCard` the inverted black card used for a single highlighted metric
 */

type DivProps = HTMLAttributes<HTMLDivElement>;

export function Panel({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/60 bg-white/40 p-4 backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cn('rounded-2xl border border-gray-100 bg-white p-4 shadow-sm', className)}
      {...props}
    />
  );
}

export function InkCard({ className, ...props }: DivProps) {
  return (
    <div className={cn('rounded-2xl bg-black p-4 text-white shadow-md', className)} {...props} />
  );
}

export function AccentCard({ className, ...props }: DivProps) {
  return (
    <div
      className={cn('rounded-2xl bg-accent p-4 text-white shadow-lg', className)}
      {...props}
    />
  );
}

/** A soft inner row used for list items inside a Panel. */
export function ListRow({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl border border-gray-100 bg-white/80 p-2.5',
        className,
      )}
      {...props}
    />
  );
}

interface SectionProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Panel with the small-caps header treatment used across the dashboard. */
export function Section({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: SectionProps) {
  return (
    <Panel className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-700">{title}</div>
          {subtitle ? <div className="mt-0.5 text-[11px] text-gray-400">{subtitle}</div> : null}
        </div>
        {action}
      </div>
      <div className={cn('min-w-0', bodyClassName)}>{children}</div>
    </Panel>
  );
}

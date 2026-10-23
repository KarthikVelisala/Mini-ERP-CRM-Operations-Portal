import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md';

const VARIANTS: Record<ButtonVariant, string> = {
  // Pill shapes and the black / accent-pink pairing come from the UI reference.
  primary: 'bg-black text-white hover:bg-gray-800 shadow-sm',
  accent: 'bg-accent text-white hover:bg-accent-hover shadow-sm',
  outline: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm',
  ghost: 'bg-transparent text-gray-600 hover:bg-white/70',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 shadow-sm',
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'text-[10px] font-medium px-2.5 py-1 gap-1',
  sm: 'text-xs font-medium px-3 py-1.5 gap-1.5',
  md: 'text-sm font-medium px-4 py-2 gap-2',
};

const BASE =
  'inline-flex items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export interface ButtonProps
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'sm',
  icon,
  children,
  className,
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends CommonProps {
  to: string;
  state?: unknown;
}

export function ButtonLink({
  to,
  state,
  variant = 'primary',
  size = 'sm',
  icon,
  children,
  className,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      state={state}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
    >
      {icon}
      {children}
    </Link>
  );
}

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'accent';
}

/** The circular icon buttons used in the header and toolbars. */
export function IconButton({ label, children, className, tone = 'default', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition',
        tone === 'accent'
          ? 'h-8 w-8 bg-accent text-white hover:bg-accent-hover'
          : 'p-2 text-gray-600 hover:bg-white/60',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

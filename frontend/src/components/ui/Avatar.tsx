import { cn } from '../../lib/cn';
import { initials } from '../../lib/format';

const SIZES = {
  xs: 'h-4 w-4 text-[8px]',
  sm: 'h-5 w-5 text-[9px]',
  md: 'h-8 w-8 text-[11px]',
  lg: 'h-10 w-10 text-sm',
} as const;

interface AvatarProps {
  name: string;
  size?: keyof typeof SIZES;
  tone?: 'ink' | 'accent' | 'soft';
  className?: string;
}

/**
 * The reference uses photo avatars; an internal ERP has no avatar uploads, so
 * the same circular slot is filled with a monogram in the brand palette.
 */
export function Avatar({ name, size = 'sm', tone = 'ink', className }: AvatarProps) {
  const tones = {
    ink: 'bg-black text-white',
    accent: 'bg-accent text-white',
    soft: 'bg-gray-200 text-gray-700',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
        SIZES[size],
        tones[tone],
        className,
      )}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

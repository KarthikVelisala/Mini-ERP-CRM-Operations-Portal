import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import {
  CHALLAN_STATUS_LABEL,
  CUSTOMER_STATUS_LABEL,
  CUSTOMER_TYPE_LABEL,
  ROLE_LABEL,
} from '../../lib/labels';
import type { ChallanStatus, CustomerStatus, CustomerType, MovementType, Role } from '../../types/api';

export type BadgeTone = 'neutral' | 'accent' | 'ink' | 'success' | 'warning' | 'danger' | 'muted';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-gray-100 text-gray-600',
  accent: 'bg-accent text-white',
  ink: 'bg-black text-white',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  muted: 'bg-white/80 text-gray-500 border border-gray-200',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function Badge({ tone = 'neutral', children, className, icon }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Square-ish badge used for percentages next to values. */
export function Chip({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const CUSTOMER_STATUS_TONE: Record<CustomerStatus, BadgeTone> = {
  LEAD: 'warning',
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

const CHALLAN_STATUS_TONE: Record<ChallanStatus, BadgeTone> = {
  DRAFT: 'neutral',
  CONFIRMED: 'success',
  CANCELLED: 'danger',
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return <Badge tone={CUSTOMER_STATUS_TONE[status]}>{CUSTOMER_STATUS_LABEL[status]}</Badge>;
}

export function ChallanStatusBadge({ status }: { status: ChallanStatus }) {
  return <Badge tone={CHALLAN_STATUS_TONE[status]}>{CHALLAN_STATUS_LABEL[status]}</Badge>;
}

export function CustomerTypeBadge({ type }: { type: CustomerType }) {
  return <Badge tone="muted">{CUSTOMER_TYPE_LABEL[type]}</Badge>;
}

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone="ink">{ROLE_LABEL[role]}</Badge>;
}

export function MovementBadge({ type }: { type: MovementType }) {
  return type === 'IN' ? (
    <Badge tone="success" icon={<ArrowDownRight className="h-3 w-3" />}>
      Stock in
    </Badge>
  ) : (
    <Badge tone="accent" icon={<ArrowUpRight className="h-3 w-3" />}>
      Stock out
    </Badge>
  );
}

/** Percentage delta badge — accent when up, neutral when flat or down. */
export function TrendBadge({ value, className }: { value: number; className?: string }) {
  const isUp = value >= 0;

  return (
    <Badge tone={isUp ? 'accent' : 'neutral'} className={className}>
      {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </Badge>
  );
}

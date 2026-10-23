import { useApiQuery } from './useApiQuery';
import { useAuth } from './useAuth';
import type { BadgeKey } from '../components/layout/navigation';

/**
 * Small counts shown as pink pills in the sidebar. Each query asks for a single
 * row and reads the total from the pagination metadata, so the badges cost
 * almost nothing to keep fresh.
 */
export function useNavBadges(): Record<BadgeKey, number> {
  const { can } = useAuth();

  const followUps = useApiQuery<unknown[]>(
    can('customer:read') ? '/customers' : null,
    { pageSize: 1, followUpDue: 'true' },
  );

  const lowStock = useApiQuery<unknown[]>(
    can('product:read') ? '/products' : null,
    { pageSize: 1, lowStock: 'true' },
  );

  const drafts = useApiQuery<unknown[]>(
    can('challan:read') ? '/challans' : null,
    { pageSize: 1, status: 'DRAFT' },
  );

  return {
    followUpsDue: followUps.meta?.total ?? 0,
    lowStock: lowStock.meta?.total ?? 0,
    drafts: drafts.meta?.total ?? 0,
  };
}

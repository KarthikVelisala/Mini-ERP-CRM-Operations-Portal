import {
  Boxes,
  ClipboardList,
  Clock,
  Compass,
  FileText,
  PackageSearch,
  ScrollText,
  TrendingDown,
  Users,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Permission } from '../../types/api';

export type BadgeKey = 'followUpsDue' | 'lowStock' | 'drafts';

export interface NavItem {
  label: string;
  to: string;
  /** Capability required to see the entry; omitted entries are always visible. */
  permission?: Permission;
  badge?: BadgeKey;
  /** Marks the item active for nested routes too. */
  matchPrefix?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

/** The compact links that sit above the grouped navigation, as in the reference. */
export const QUICK_LINKS: Array<NavItem & { icon: LucideIcon }> = [
  { label: 'Overview', to: '/', icon: Compass },
  {
    label: 'Follow-ups due',
    to: '/customers?followUpDue=true',
    icon: Clock,
    permission: 'customer:read',
    badge: 'followUpsDue',
  },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'relationships',
    label: 'Relationships',
    icon: Users,
    items: [
      { label: 'Customers', to: '/customers', permission: 'customer:read', matchPrefix: true },
      { label: 'Add customer', to: '/customers/new', permission: 'customer:write' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Boxes,
    items: [
      { label: 'Products', to: '/products', permission: 'product:read', matchPrefix: true },
      { label: 'Stock movements', to: '/inventory', permission: 'inventory:read' },
      { label: 'Low stock', to: '/products?lowStock=true', permission: 'product:read', badge: 'lowStock' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: FileText,
    items: [
      { label: 'Sales challans', to: '/challans', permission: 'challan:read', matchPrefix: true },
      { label: 'New challan', to: '/challans/new', permission: 'challan:write' },
      { label: 'Drafts', to: '/challans?status=DRAFT', permission: 'challan:read', badge: 'drafts' },
    ],
  },
];

/** The vertical icon rail on the far left of the sidebar. */
export const ICON_RAIL: Array<{ label: string; to: string; icon: LucideIcon; permission?: Permission }> = [
  { label: 'Overview', to: '/', icon: Compass },
  { label: 'Customers', to: '/customers', icon: UserPlus, permission: 'customer:read' },
  { label: 'Products', to: '/products', icon: PackageSearch, permission: 'product:read' },
  { label: 'Stock movements', to: '/inventory', icon: TrendingDown, permission: 'inventory:read' },
  { label: 'Challans', to: '/challans', icon: ScrollText, permission: 'challan:read' },
];

export const MOBILE_TABS: Array<{ label: string; to: string; icon: LucideIcon; permission?: Permission }> = [
  { label: 'Overview', to: '/', icon: Compass },
  { label: 'Customers', to: '/customers', icon: Users, permission: 'customer:read' },
  { label: 'Products', to: '/products', icon: Boxes, permission: 'product:read' },
  { label: 'Stock', to: '/inventory', icon: ClipboardList, permission: 'inventory:read' },
  { label: 'Challans', to: '/challans', icon: FileText, permission: 'challan:read' },
];

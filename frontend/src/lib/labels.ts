import type { ChallanStatus, CustomerStatus, CustomerType, MovementType, Role } from '../types/api';

/**
 * Human readable labels for the API enums. Kept apart from the badge components
 * so both plain text and JSX call sites share one source of wording.
 */

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Admin',
  SALES: 'Sales',
  WAREHOUSE: 'Warehouse',
  ACCOUNTS: 'Accounts',
};

export const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  RETAIL: 'Retail',
  WHOLESALE: 'Wholesale',
  DISTRIBUTOR: 'Distributor',
};

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  LEAD: 'Lead',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const CHALLAN_STATUS_LABEL: Record<ChallanStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
};

export const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = {
  IN: 'Stock in',
  OUT: 'Stock out',
};

export const roleLabel = (role: Role) => ROLE_LABEL[role];
export const customerTypeLabel = (type: CustomerType) => CUSTOMER_TYPE_LABEL[type];
export const customerStatusLabel = (status: CustomerStatus) => CUSTOMER_STATUS_LABEL[status];
export const challanStatusLabel = (status: ChallanStatus) => CHALLAN_STATUS_LABEL[status];

/** `[{ value, label }]` lists for the select controls. */
export const toOptions = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

export const ROLE_OPTIONS = toOptions(ROLE_LABEL);
export const CUSTOMER_TYPE_OPTIONS = toOptions(CUSTOMER_TYPE_LABEL);
export const CUSTOMER_STATUS_OPTIONS = toOptions(CUSTOMER_STATUS_LABEL);
export const CHALLAN_STATUS_OPTIONS = toOptions(CHALLAN_STATUS_LABEL);
export const MOVEMENT_TYPE_OPTIONS = toOptions(MOVEMENT_TYPE_LABEL);

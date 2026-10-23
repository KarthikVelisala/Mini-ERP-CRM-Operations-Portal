import { Role } from '@prisma/client';

/**
 * Capability based authorization.
 *
 * Routes declare the capability they need instead of listing roles inline, so
 * the access rules for the whole application live in this one table. The same
 * capability list is returned to the client on login, which lets the frontend
 * show role appropriate navigation and actions — while this table remains the
 * authoritative check on the server.
 *
 * Roles
 * -----
 * ADMIN     full access to every module
 * SALES     owns the customer relationship and raises sales challans
 * WAREHOUSE owns the product catalogue and physical stock movements
 * ACCOUNTS  read-only visibility across customers, stock and challans
 */
export const PERMISSIONS = {
  'customer:read': [Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS],
  'customer:write': [Role.ADMIN, Role.SALES],
  'followup:write': [Role.ADMIN, Role.SALES],

  'product:read': [Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS],
  'product:write': [Role.ADMIN, Role.WAREHOUSE],

  'inventory:read': [Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS],
  'inventory:write': [Role.ADMIN, Role.WAREHOUSE],

  'challan:read': [Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS],
  'challan:write': [Role.ADMIN, Role.SALES],
  // The warehouse physically dispatches the goods, so it may confirm as well.
  'challan:confirm': [Role.ADMIN, Role.SALES, Role.WAREHOUSE],
  'challan:cancel': [Role.ADMIN, Role.SALES],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export const roleHasPermission = (role: Role, permission: Permission): boolean =>
  (PERMISSIONS[permission] as readonly Role[]).includes(role);

/** Every capability granted to a role — sent to the client after login. */
export const permissionsForRole = (role: Role): Permission[] =>
  ALL_PERMISSIONS.filter((permission) => roleHasPermission(role, permission));

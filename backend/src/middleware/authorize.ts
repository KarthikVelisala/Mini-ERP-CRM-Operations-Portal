import type { RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { roleHasPermission, type Permission } from '../config/permissions';
import { ApiError } from '../utils/ApiError';

/**
 * Guards a route with a capability from the permission table. Must run after
 * `authenticate`; a missing user is treated as unauthenticated (401) while a
 * known user without the capability is forbidden (403).
 */
export const authorize =
  (permission: Permission): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication is required'));
      return;
    }

    if (!roleHasPermission(req.user.role, permission)) {
      next(
        ApiError.forbidden(
          `Your role (${req.user.role}) is not allowed to perform this action`,
        ),
      );
      return;
    }

    next();
  };

/** Restricts a route to an explicit set of roles. */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication is required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden(`This action requires one of: ${roles.join(', ')}`));
      return;
    }

    next();
  };

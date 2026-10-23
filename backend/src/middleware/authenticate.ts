import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';

const BEARER_PREFIX = 'Bearer ';

/**
 * Requires a valid `Authorization: Bearer <token>` header. The user is re-read
 * from the database on every request so deactivated accounts lose access
 * immediately instead of when their token happens to expire.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    next(ApiError.unauthorized('Authentication is required'));
    return;
  }

  const token = header.slice(BEARER_PREFIX.length).trim();

  if (!token) {
    next(ApiError.unauthorized('Authentication is required'));
    return;
  }

  void (async () => {
    try {
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        next(ApiError.unauthorized('Your account is no longer active'));
        return;
      }

      req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
      next();
    } catch (error) {
      next(error);
    }
  })();
};

/** Narrowed accessor for controllers that run behind `authenticate`. */
export const requireUser = (req: { user?: Express.Request['user'] }) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication is required');
  }
  return req.user;
};

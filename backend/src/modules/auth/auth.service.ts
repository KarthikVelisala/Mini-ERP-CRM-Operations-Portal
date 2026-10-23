import type { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { permissionsForRole, type Permission } from '../../config/permissions';
import { ApiError } from '../../utils/ApiError';
import { signAccessToken } from '../../utils/jwt';
import { verifyPassword } from '../../utils/password';
import type { LoginInput } from './auth.schema';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: User['role'];
  /** Capabilities granted by the role — drives role aware UI on the client. */
  permissions: Permission[];
}

export const toPublicUser = (user: Pick<User, 'id' | 'name' | 'email' | 'role'>): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  permissions: permissionsForRole(user.role),
});

export const login = async ({ email, password }: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // The same message is used for unknown emails and wrong passwords so the API
  // does not reveal which accounts exist.
  const invalidCredentials = ApiError.unauthorized('Invalid email or password');

  if (!user) {
    throw invalidCredentials;
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw invalidCredentials;
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Contact an administrator.');
  }

  const token = signAccessToken({ sub: user.id, email: user.email, role: user.role });

  return { token, user: toPublicUser(user) };
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return toPublicUser(user);
};

import { createContext } from 'react';
import type { AuthUser, Permission } from '../types/api';

export interface AuthContextValue {
  user: AuthUser | null;
  /** True while a stored token is being exchanged for a profile on boot. */
  isInitialising: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => void;
  can: (permission: Permission) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

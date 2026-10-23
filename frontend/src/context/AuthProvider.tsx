import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, apiRequest, setUnauthorizedHandler, tokenStorage } from '../lib/api';
import type { AuthUser } from '../types/api';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitialising, setIsInitialising] = useState(true);

  const signOut = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  // A token rejected anywhere in the app ends the session immediately.
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // Restore the session on a page refresh.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      if (!tokenStorage.get()) {
        setIsInitialising(false);
        return;
      }

      try {
        const { data } = await api.get<{ user: AuthUser }>('/auth/me');
        if (!cancelled) setUser(data.user);
      } catch {
        tokenStorage.clear();
      } finally {
        if (!cancelled) setIsInitialising(false);
      }
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data } = await apiRequest<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuthRedirect: true,
    });

    tokenStorage.set(data.token);
    setUser(data.user);

    return data.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isInitialising,
      signIn,
      signOut,
      can: (permission) => user?.permissions.includes(permission) ?? false,
    }),
    [user, isInitialising, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

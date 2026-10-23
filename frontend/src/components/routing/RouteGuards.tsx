import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { EmptyState } from '../ui/States';
import { ButtonLink } from '../ui/Button';

/** Full-screen splash shown while the stored session is being restored. */
export function SessionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-lg font-bold text-white">
          E
        </span>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-r-transparent" />
        <p className="text-xs text-gray-500">Restoring your session…</p>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children?: ReactNode }) {
  const { user, isInitialising } = useAuth();
  const location = useLocation();

  if (isInitialising) return <SessionLoading />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children ?? <Outlet />}</>;
}

/**
 * Client-side guard for role-restricted screens. The server enforces the same
 * capability on every request; this only avoids showing a page the user could
 * never use.
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Parameters<ReturnType<typeof useAuth>['can']>[0];
  children?: ReactNode;
}) {
  const { can, user } = useAuth();

  if (!can(permission)) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-5 w-5" />}
        title="You do not have access to this screen"
        description={`Your role (${user?.role ?? 'unknown'}) is not permitted to use this part of the portal. Contact an administrator if you need access.`}
        action={
          <ButtonLink to="/" variant="outline">
            Back to overview
          </ButtonLink>
        }
      />
    );
  }

  return <>{children ?? <Outlet />}</>;
}

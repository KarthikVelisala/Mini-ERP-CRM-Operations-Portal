import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronUp, LifeBuoy, LogOut, Settings } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../hooks/useAuth';
import { useNavBadges } from '../../hooks/useNavBadges';
import { roleLabel } from '../../lib/labels';
import {
  ICON_RAIL,
  NAV_GROUPS,
  QUICK_LINKS,
  type BadgeKey,
  type NavItem,
} from './navigation';

interface SidebarProps {
  /** Closes the drawer after navigating on small screens. */
  onNavigate?: () => void;
}

const isActive = (pathname: string, search: string, item: NavItem) => {
  const [itemPath, itemQuery] = item.to.split('?');

  if (itemQuery) {
    return pathname === itemPath && search.includes(itemQuery);
  }

  if (item.matchPrefix) {
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  }

  return pathname === itemPath && !search;
};

/**
 * Reproduces the reference sidebar: a slim icon rail beside a column of small,
 * grouped text links with collapsible sections and pink count pills.
 */
export function Sidebar({ onNavigate }: SidebarProps) {
  const { pathname, search } = useLocation();
  const { user, can, signOut } = useAuth();
  const badges = useNavBadges();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const allowed = (permission?: NavItem['permission']) => !permission || can(permission);
  const badgeValue = (key?: BadgeKey) => (key ? badges[key] : 0);

  return (
    <aside className="flex min-h-full w-full flex-col justify-between py-2 pl-2 pr-1">
      <div className="flex gap-4">
        {/* Icon rail */}
        <div className="flex shrink-0 flex-col items-center gap-4 pt-0.5 text-gray-700">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-[10px] font-bold text-white">
            me
          </div>
          {ICON_RAIL.filter((entry) => allowed(entry.permission)).map((entry) => {
            const Icon = entry.icon;
            const active = pathname === entry.to || (entry.to !== '/' && pathname.startsWith(entry.to));

            return (
              <Link
                key={entry.to}
                to={entry.to}
                onClick={onNavigate}
                title={entry.label}
                aria-label={entry.label}
                className={cn(
                  'transition',
                  active ? 'text-accent' : 'text-gray-500 hover:text-black',
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </div>

        {/* Text navigation */}
        <nav className="min-w-0 flex-1 space-y-3.5 text-xs font-medium text-gray-600">
          {QUICK_LINKS.filter((entry) => allowed(entry.permission)).map((entry) => {
            const Icon = entry.icon;
            const count = badgeValue(entry.badge);

            return (
              <Link
                key={entry.to}
                to={entry.to}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-2 transition hover:text-black',
                  isActive(pathname, search, entry) && 'font-semibold text-gray-900',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{entry.label}</span>
                {count > 0 ? <CountPill value={count} /> : null}
              </Link>
            );
          })}

          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((item) => allowed(item.permission));
            if (items.length === 0) return null;

            const isCollapsed = collapsed[group.id] ?? false;

            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((current) => ({ ...current, [group.id]: !isCollapsed }))
                  }
                  aria-expanded={!isCollapsed}
                  className="flex w-full items-center justify-between font-bold text-gray-900 transition hover:text-accent"
                >
                  <span>{group.label}</span>
                  <ChevronUp
                    className={cn(
                      'h-3 w-3 text-gray-400 transition-transform',
                      isCollapsed && 'rotate-180',
                    )}
                  />
                </button>

                {!isCollapsed ? (
                  <div className="mt-2 space-y-2 border-l border-gray-300 pl-3 text-gray-500">
                    {items.map((item) => {
                      const count = badgeValue(item.badge);

                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={onNavigate}
                          className={cn(
                            'flex items-center justify-between gap-2 transition hover:text-black',
                            isActive(pathname, search, item) && 'font-semibold text-accent',
                          )}
                        >
                          <span className="truncate">{item.label}</span>
                          {count > 0 ? <CountPill value={count} /> : null}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer: identity and session actions */}
      <div className="mt-6 space-y-3 pl-0.5">
        {user ? (
          <div className="rounded-2xl border border-white/60 bg-white/50 px-3 py-2">
            <p className="truncate text-[11px] font-semibold text-gray-800">{user.name}</p>
            <p className="truncate text-[10px] text-gray-500">{roleLabel(user.role)}</p>
          </div>
        ) : null}

        <div className="flex items-center gap-4 text-gray-500">
          <Link to="/settings" onClick={onNavigate} title="Settings" aria-label="Settings">
            <Settings className="h-5 w-5 transition hover:text-black" />
          </Link>
          <span className="relative" title="Signed in with a demo account">
            <LifeBuoy className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent" />
          </span>
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out"
            className="ml-auto transition hover:text-accent"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function CountPill({ value }: { value: number }) {
  return (
    <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      {value > 99 ? '99+' : value}
    </span>
  );
}

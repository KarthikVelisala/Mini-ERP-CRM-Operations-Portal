import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../hooks/useAuth';
import { roleLabel } from '../../lib/labels';
import { Avatar } from '../ui/Avatar';

interface HeaderProps {
  onOpenMenu: () => void;
}

/**
 * The reference header: brand mark and workspace switcher on the left, a
 * rounded global search in the middle, and profile plus a pink primary action
 * on the right.
 */
export function Header({ onOpenMenu }: HeaderProps) {
  const navigate = useNavigate();
  const { user, can, signOut } = useAuth();
  const [term, setTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isMenuOpen]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = term.trim();
    if (!query) return;

    // Customers are the most common lookup; fall back to challans otherwise.
    navigate(
      can('customer:read')
        ? `/customers?search=${encodeURIComponent(query)}`
        : `/challans?search=${encodeURIComponent(query)}`,
    );
  };

  const primaryAction = can('challan:write')
    ? { to: '/challans/new', label: 'New sales challan' }
    : can('customer:write')
      ? { to: '/customers/new', label: 'New customer' }
      : can('product:write')
        ? { to: '/products/new', label: 'New product' }
        : null;

  return (
    <header className="flex items-center justify-between gap-3 px-2 py-1">
      <div className="flex items-center gap-3 lg:w-56">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="rounded-full p-1.5 text-gray-600 transition hover:bg-white/60 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-lg font-bold text-white">
            E
          </span>
          <span className="hidden items-center gap-1 text-sm font-semibold sm:flex">
            Mini ERP + CRM
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </span>
        </Link>
      </div>

      <form onSubmit={onSearch} className="mx-2 hidden max-w-lg flex-1 sm:block">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder='Try searching "Shree Traders" or "CH-202608"'
            aria-label="Search customers and challans"
            className="w-full rounded-full bg-white/80 py-2 pl-10 pr-4 text-sm placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to="/settings"
          aria-label="Workspace settings"
          className="hidden rounded-full p-2 text-gray-600 transition hover:bg-white/50 sm:block"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className="flex items-center rounded-full bg-gradient-to-tr from-amber-300 to-accent p-[1.5px] transition hover:opacity-90"
          >
            <span className="rounded-full bg-shell p-[1px]">
              <Avatar name={user?.name ?? 'User'} size="md" />
            </span>
          </button>

          {isMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-56 animate-fade-in rounded-2xl border border-white/60 bg-white p-2 shadow-xl"
            >
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="truncate text-xs font-semibold text-gray-800">{user?.name}</p>
                <p className="truncate text-[11px] text-gray-500">{user?.email}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-accent">
                  {user ? roleLabel(user.role) : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut();
                }}
                className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>

        {primaryAction ? (
          <Link
            to={primaryAction.to}
            aria-label={primaryAction.label}
            title={primaryAction.label}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-hover',
            )}
          >
            <Plus className="h-5 w-5" />
          </Link>
        ) : null}
      </div>
    </header>
  );
}

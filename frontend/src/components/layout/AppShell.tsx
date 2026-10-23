import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../hooks/useAuth';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MOBILE_TABS } from './navigation';

/**
 * The application frame from the reference: a warm canvas, one large rounded
 * shell holding the header, the sidebar and a translucent content panel.
 *
 * Below `lg` the sidebar becomes a slide-over drawer and a bottom tab bar takes
 * over primary navigation, so the same layout works on a phone.
 */
export function AppShell() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { pathname } = useLocation();
  const { can } = useAuth();

  // Close the drawer whenever navigation happens.
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  return (
    <div className="flex min-h-screen justify-center bg-canvas p-2 text-ink antialiased sm:p-4 lg:p-6">
      <div className="flex w-full max-w-[1440px] flex-col gap-4 rounded-[24px] border border-white/40 bg-shell p-3 shadow-2xl sm:rounded-shell sm:p-4">
        <Header onOpenMenu={() => setIsDrawerOpen(true)} />

        <div className="flex flex-1 items-start gap-4">
          <div className="hidden w-56 shrink-0 self-stretch lg:block">
            <Sidebar />
          </div>

          <main className="flex min-w-0 flex-1 flex-col gap-6 rounded-[22px] border border-white/60 bg-white/60 p-3 shadow-sm backdrop-blur-md sm:rounded-panel sm:p-5 lg:p-6">
            <Outlet />
          </main>
        </div>

        {/* Bottom tabs replace the sidebar on small screens */}
        <nav className="flex items-center justify-between gap-1 rounded-full border border-white/60 bg-white/70 px-2 py-1.5 backdrop-blur-md lg:hidden">
          {MOBILE_TABS.filter((tab) => !tab.permission || can(tab.permission)).map((tab) => {
            const Icon = tab.icon;
            const active = tab.to === '/' ? pathname === '/' : pathname.startsWith(tab.to);

            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-medium transition',
                  active ? 'bg-black text-white' : 'text-gray-500 hover:text-black',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile navigation drawer */}
      {isDrawerOpen ? (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative z-10 flex h-full w-72 max-w-[85vw] animate-fade-in flex-col overflow-y-auto border-r border-white/40 bg-shell p-4 shadow-2xl scrollbar-thin">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Navigation</span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close navigation"
                className="rounded-full p-1.5 text-gray-500 transition hover:bg-white/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Sidebar onNavigate={() => setIsDrawerOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

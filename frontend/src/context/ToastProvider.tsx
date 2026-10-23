import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../lib/cn';
import { ToastContext, type Toast, type ToastContextValue, type ToastTone } from './toast-context';

const TONE_STYLES: Record<ToastTone, { wrapper: string; icon: ReactNode }> = {
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  },
  error: {
    wrapper: 'border-red-200 bg-red-50 text-red-800',
    icon: <AlertCircle className="h-4 w-4 text-red-600" />,
  },
  info: {
    wrapper: 'border-gray-200 bg-white text-gray-800',
    icon: <Info className="h-4 w-4 text-gray-500" />,
  },
};

let nextId = 0;

/** Lightweight, dependency-free feedback layer for success and error messages. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (tone: ToastTone, message: string) => {
      const id = ++nextId;
      setToasts((current) => [...current, { id, tone, message }]);
      // Errors linger longer because they usually need to be read carefully.
      window.setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4000);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      notify,
      success: (message) => notify('success', message),
      error: (message) => notify('error', message),
    }),
    [notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex animate-fade-in items-start gap-2 rounded-2xl border px-3 py-2.5 text-xs font-medium shadow-lg',
              TONE_STYLES[toast.tone].wrapper,
            )}
          >
            <span className="mt-px shrink-0">{TONE_STYLES[toast.tone].icon}</span>
            <span className="min-w-0 flex-1 break-words">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-full p-0.5 opacity-60 transition hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

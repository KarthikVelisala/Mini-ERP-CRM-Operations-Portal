import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
} as const;

/**
 * Dialog styled as another layer of the same shell: heavily rounded, warm
 * background, hairline border.
 */
export function Modal({ isOpen, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'my-auto w-full animate-fade-in rounded-[28px] border border-white/60 bg-shell p-5 shadow-2xl',
          SIZES[size],
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-gray-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-1.5 text-gray-500 transition hover:bg-white/70 hover:text-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/70 p-4">{children}</div>

        {footer ? <div className="mt-4 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  isBusy?: boolean;
  tone?: 'primary' | 'danger';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel,
  onConfirm,
  isBusy,
  tone = 'primary',
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium text-white shadow-sm transition disabled:opacity-50',
              tone === 'danger' ? 'bg-accent hover:bg-accent-hover' : 'bg-black hover:bg-gray-800',
            )}
          >
            {isBusy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm text-gray-700">{message}</div>
    </Modal>
  );
}

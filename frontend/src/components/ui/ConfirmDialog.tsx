import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    button: 'danger' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    button: 'primary' as const,
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    button: 'primary' as const,
  },
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const config = variantConfig[variant];
  const Icon = config.icon;

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setIsVisible(true));
      // Focus the cancel button for keyboard a11y
      setTimeout(() => cancelRef.current?.focus(), 100);
    } else {
      setIsVisible(false);
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center px-4 transition-all duration-200
        ${isVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'}`}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className={`w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-6
          transition-all duration-200 ease-out
          ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
      >
        <div className="flex gap-4">
          <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full ${config.iconBg}`}>
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={config.button} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

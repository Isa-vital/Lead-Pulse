import { useEffect, useState } from 'react';
import { useToastStore, type Toast } from '@/stores/toastStore';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = Toast['type'];

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors: Record<ToastType, { bg: string; border: string; icon: string; text: string; darkBg: string; darkBorder: string }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
    text: 'text-green-800',
    darkBg: 'dark:bg-green-900/20',
    darkBorder: 'dark:border-green-800',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    text: 'text-red-800',
    darkBg: 'dark:bg-red-900/20',
    darkBorder: 'dark:border-red-800',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500',
    text: 'text-amber-800',
    darkBg: 'dark:bg-amber-900/20',
    darkBorder: 'dark:border-amber-800',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    text: 'text-blue-800',
    darkBg: 'dark:bg-blue-900/20',
    darkBorder: 'dark:border-blue-800',
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const Icon = icons[toast.type];
  const color = colors[toast.type];

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onRemove, 300);
  };

  return (
    <div
      className={`
        flex items-start gap-3 w-80 max-w-sm rounded-xl border p-4 shadow-lg backdrop-blur-sm
        transition-all duration-300 ease-out
        ${color.bg} ${color.border} ${color.darkBg} ${color.darkBorder}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${color.icon}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${color.text} dark:text-gray-100`}>{toast.title}</p>
        {toast.message && (
          <p className={`mt-0.5 text-xs ${color.text} dark:text-gray-300 opacity-80`}>{toast.message}</p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <X className={`h-4 w-4 ${color.icon}`} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}

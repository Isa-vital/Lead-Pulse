import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

export function Modal({ open, onClose, title, children, size = 'md', showClose = true }: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = '';
      }, 200);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-200
        ${isVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`w-full ${sizeClasses[size]} rounded-2xl bg-white dark:bg-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto
          transition-all duration-200 ease-out
          ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl z-10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            {showClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

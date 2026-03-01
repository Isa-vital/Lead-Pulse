import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++toastId}`;
    const duration = toast.duration ?? 4000;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  success: (title, message) =>
    set((state) => {
      const id = `toast-${++toastId}`;
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 4000);
      return { toasts: [...state.toasts, { id, type: 'success' as const, title, message }] };
    }),

  error: (title, message) =>
    set((state) => {
      const id = `toast-${++toastId}`;
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 6000);
      return { toasts: [...state.toasts, { id, type: 'error' as const, title, message }] };
    }),

  warning: (title, message) =>
    set((state) => {
      const id = `toast-${++toastId}`;
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 5000);
      return { toasts: [...state.toasts, { id, type: 'warning' as const, title, message }] };
    }),

  info: (title, message) =>
    set((state) => {
      const id = `toast-${++toastId}`;
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 4000);
      return { toasts: [...state.toasts, { id, type: 'info' as const, title, message }] };
    }),
}));

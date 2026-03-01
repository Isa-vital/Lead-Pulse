import type { ReactNode } from 'react';
import { FileX, Users, ShoppingCart, Target, Package, Inbox, Search, type LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

const defaultIcons: Record<string, LucideIcon> = {
  customers: Users,
  orders: ShoppingCart,
  leads: Target,
  products: Package,
  search: Search,
  inbox: Inbox,
  default: FileX,
};

export function EmptyState({
  icon: Icon = FileX,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700/50 mb-4">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          <Button onClick={action.onClick} size="sm">{action.label}</Button>
        </div>
      )}
      {children}
    </div>
  );
}

export { defaultIcons as emptyStateIcons };

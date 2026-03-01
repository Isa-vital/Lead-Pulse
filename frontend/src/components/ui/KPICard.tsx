import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  subtitle?: string;
}

export function KPICard({ title, value, change, changeLabel, icon: Icon, iconColor = 'text-primary-600 bg-primary-50', subtitle }: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={cn('rounded-xl p-3', iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {(change !== undefined || subtitle) && (
        <div className="mt-3 flex items-center gap-1.5 text-sm">
          {change !== undefined && (
            <>
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={cn(isPositive ? 'text-green-600' : 'text-red-600', 'font-medium')}>
                {isPositive ? '+' : ''}{change}%
              </span>
              {changeLabel && <span className="text-gray-500">{changeLabel}</span>}
            </>
          )}
          {subtitle && <span className="text-gray-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

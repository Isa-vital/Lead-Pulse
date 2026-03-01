import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={cn(
        'animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700',
        className
      )}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton
              key={`${row}-${col}`}
              className={cn('h-4 flex-1', col === 0 && 'max-w-[200px]')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

export function KPICardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className={`${height} flex items-end justify-between gap-2 pt-4`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-md"
            style={{ height: `${30 + Math.random() * 60}%` } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

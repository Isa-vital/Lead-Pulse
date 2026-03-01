import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-sm text-gray-500">Loading Lead Pulse...</p>
      </div>
    </div>
  );
}

export function LoadingSpinner({ className = 'h-6 w-6' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-primary-600 ${className}`} />;
}

import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="rounded-2xl bg-gray-100 p-6 mb-4">
        <Construction className="h-12 w-12 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-500 max-w-md">
        {description ?? 'This section is under development and will be available soon.'}
      </p>
    </div>
  );
}

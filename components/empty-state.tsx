import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon = <AlertCircle className="w-12 h-12" />,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-zinc-500 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-300 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-400 mb-6 max-w-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-amber-400 text-zinc-900 font-medium rounded-lg hover:bg-amber-500 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

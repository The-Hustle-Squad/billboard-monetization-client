import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  description,
}: StatCardProps) {
  return (
    <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 hover:border-amber-400/50 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {description && (
            <p className="text-xs text-zinc-500 mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div className="text-amber-400 opacity-60">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-zinc-500">vs last period</span>
        </div>
      )}
    </div>
  );
}

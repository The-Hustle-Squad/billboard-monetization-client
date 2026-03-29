interface StatusBadgeProps {
  status: 'available' | 'booked' | 'expired' | 'locked' | 'confirmed' | 'cancelled';
  label?: string;
}

const statusConfig = {
  available: {
    bg: 'bg-emerald-900/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    label: 'Available',
  },
  booked: {
    bg: 'bg-amber-900/30',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
    label: 'Booked',
  },
  expired: {
    bg: 'bg-zinc-700/50',
    text: 'text-zinc-400',
    dot: 'bg-zinc-500',
    label: 'Expired',
  },
  locked: {
    bg: 'bg-blue-900/30',
    text: 'text-blue-400',
    dot: 'bg-blue-500',
    label: 'Locked',
  },
  confirmed: {
    bg: 'bg-emerald-900/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    label: 'Confirmed',
  },
  cancelled: {
    bg: 'bg-rose-900/30',
    text: 'text-rose-400',
    dot: 'bg-rose-500',
    label: 'Cancelled',
  },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {label || config.label}
    </span>
  );
}

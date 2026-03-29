export function StatCardSkeleton() {
  return (
    <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 bg-zinc-700 rounded w-24 mb-2" />
          <div className="h-8 bg-zinc-700 rounded w-32 mt-2" />
        </div>
        <div className="h-8 w-8 bg-zinc-700 rounded" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-zinc-700 animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-zinc-700 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-zinc-700 rounded w-24" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-zinc-700 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-zinc-700 rounded w-16" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-zinc-700 rounded-full w-20" />
      </td>
    </tr>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 h-80 animate-pulse">
      <div className="h-6 bg-zinc-700 rounded w-32 mb-4" />
      <div className="flex-1 flex items-end justify-around gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-zinc-700 rounded"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}

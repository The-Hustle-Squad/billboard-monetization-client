'use client';

import { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Grid3X3, Clock, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/stat-card';
import { getAnalyticsSummary, listSlots } from '@/lib/api';
import type { AnalyticsSummary, SlotDocument, SlotStatus } from '@/lib/types';

const STATUS_ORDER: SlotStatus[] = ['available', 'locked', 'booked', 'expired'];
const STATUS_COLORS: Record<SlotStatus, string> = {
  available: '#10b981',
  locked: '#3b82f6',
  booked: '#f59e0b',
  expired: '#6b7280',
};

function aggregateByStatus(items: SlotDocument[]) {
  const counts: Record<SlotStatus, number> = {
    available: 0,
    locked: 0,
    booked: 0,
    expired: 0,
  };
  for (const s of items) {
    counts[s.status] += 1;
  }
  return STATUS_ORDER.filter((k) => counts[k] > 0).map((name) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: counts[name],
    fill: STATUS_COLORS[name],
  }));
}

export function OverviewTab() {
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotItems, setSlotItems] = useState<SlotDocument[]>([]);
  const [slotsMeta, setSlotsMeta] = useState<{ total: number; limit: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAnalyticsSummary().then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        setStats(null);
        setStatsError(error || 'Failed to load analytics');
        return;
      }
      setStats(data);
      setStatsError(null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listSlots(1, 100).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        setSlotItems([]);
        setSlotsMeta(null);
        setSlotsError(error || 'Failed to load slots');
        return;
      }
      setSlotItems(data.items);
      setSlotsMeta({ total: data.total, limit: data.limit });
      setSlotsError(null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const slotStatusBreakdown = useMemo(() => aggregateByStatus(slotItems), [slotItems]);

  const recentSlots = useMemo(() => slotItems.slice(0, 8), [slotItems]);

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {statsError && (
        <div className="rounded-lg border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {statsError}
        </div>
      )}

      {/* Stats — GET /analytics/summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Slots"
          value={stats?.totalSlots ?? '—'}
          icon={<Grid3X3 size={24} />}
          description="Active inventory"
        />
        <StatCard
          title="Booked Slots"
          value={stats?.bookedSlots ?? '—'}
          icon={<TrendingUp size={24} />}
          description="Current bookings"
        />
        <StatCard
          title="Recovered Slots"
          value={stats?.recoveredSlots ?? '—'}
          icon={<Clock size={24} />}
          description="Booked with discount"
        />
        <StatCard
          title="Recovered Revenue"
          value={stats != null ? formatCurrency(stats.recoveredRevenue) : '—'}
          icon={<DollarSign size={24} />}
          description="Sum of finalPrice (discounted)"
        />
      </div>

      {slotsError && (
        <div className="rounded-lg border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {slotsError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Slot status</h3>
          <p className="text-xs text-zinc-500 mb-4">
            From GET /slots (page 1, limit {slotsMeta?.limit ?? 100}
            {slotsMeta && slotsMeta.total > slotItems.length
              ? ` — showing ${slotItems.length} of ${slotsMeta.total} slots`
              : ''}
            )
          </p>
          {slotStatusBreakdown.length === 0 ? (
            <p className="text-zinc-500 text-sm py-12 text-center">No slot data loaded</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={slotStatusBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={90}
                  dataKey="value"
                >
                  {slotStatusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1d28',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent slots</h3>
          <p className="text-xs text-zinc-500 mb-4">
            Newest windows first (same list as status chart)
          </p>
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {recentSlots.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">No slots yet</p>
            ) : (
              recentSlots.map((slot) => (
                <div
                  key={slot._id}
                  className="flex items-center justify-between gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-700/50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-amber-400 truncate">{slot.slotId}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(slot.startTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs uppercase text-zinc-400">{slot.status}</p>
                    <p className="text-sm text-white">{formatCurrency(slot.basePrice)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Upload, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { SyncSlotsModal } from './sync-slots-modal';
import { SlotDetailPanel } from './slot-detail';
import { listSlots } from '@/lib/api';
import type { SlotDocument } from '@/lib/types';

export function SlotsManagerTab() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotDocument | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [items, setItems] = useState<SlotDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setListError(null);
    const { data, error } = await listSlots(currentPage, limit);
    if (error || !data) {
      setListError(error || 'Failed to load slots');
      setItems([]);
      setTotal(0);
      setTotalPages(0);
    } else {
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [currentPage, limit]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const filteredSlots = useMemo(() => {
    if (statusFilter === 'all') return items;
    return items.filter(slot => slot.status === statusFilter);
  }, [items, statusFilter]);

  const handleRowClick = (slot: SlotDocument) => {
    setSelectedSlot(slot);
    setDetailPanelOpen(true);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  return (
    <>
      <div className="space-y-6">
        {listError && (
          <div className="rounded-lg border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
            {listError}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="locked">Locked</option>
              <option value="booked">Booked</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <Button
            onClick={() => setSyncModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-900 w-full md:w-auto"
          >
            <Upload size={16} />
            Import Slots
          </Button>
        </div>

        {/* Table */}
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-900 border-b border-zinc-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Slot ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Start Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    End Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Base Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      Loading slots…
                    </td>
                  </tr>
                ) : (
                  filteredSlots.map((slot) => (
                    <tr
                      key={slot._id}
                      className="border-b border-zinc-700 hover:bg-zinc-700/30 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(slot)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-amber-400">
                          {slot.slotId}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-300">
                        {formatDate(slot.startTime)}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-300">
                        {formatDate(slot.endTime)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {formatCurrency(slot.basePrice)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={slot.status} />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(slot);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredSlots.length === 0 && (
            <div className="text-center py-12 text-zinc-400">
              No slots found
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              Page {currentPage} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <SyncSlotsModal
        open={syncModalOpen}
        onOpenChange={setSyncModalOpen}
        onSuccess={() => {
          loadSlots();
        }}
      />

      {selectedSlot && (
        <SlotDetailPanel
          slot={selectedSlot}
          open={detailPanelOpen}
          onOpenChange={setDetailPanelOpen}
          onBookingComplete={() => loadSlots()}
        />
      )}
    </>
  );
}

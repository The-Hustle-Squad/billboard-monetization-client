'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, Check } from 'lucide-react';
import { syncSlots } from '@/lib/api';

interface SyncSlotsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function parseIsoOrThrow(raw: string, field: string): string {
  const t = raw.trim();
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`${field} must be a valid ISO 8601 datetime (e.g. 2026-04-01T10:00:00.000Z)`);
  }
  return d.toISOString();
}

export function SyncSlotsModal({
  open,
  onOpenChange,
  onSuccess,
}: SyncSlotsModalProps) {
  const [slotData, setSlotData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
  } | null>(null);

  const handleSync = async () => {
    if (!slotData.trim()) {
      toast.error('Please enter slot data');
      return;
    }

    setIsLoading(true);
    try {
      const lines = slotData
        .trim()
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      const slots = lines.map((line, i) => {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length < 4) {
          throw new Error(
            `Line ${i + 1}: expected slotId, startTime, endTime, basePrice (comma-separated)`
          );
        }
        const [slotId, startRaw, endRaw, baseRaw] = parts;
        if (!slotId) throw new Error(`Line ${i + 1}: slotId is required`);

        const startTime = parseIsoOrThrow(startRaw, 'startTime');
        const endTime = parseIsoOrThrow(endRaw, 'endTime');
        const basePrice = parseFloat(baseRaw);
        if (Number.isNaN(basePrice) || basePrice < 0) {
          throw new Error(`Line ${i + 1}: basePrice must be a number ≥ 0`);
        }

        return { slotId, startTime, endTime, basePrice };
      });

      const { data, error } = await syncSlots({ slots });

      if (error || !data) {
        toast.error(error || 'Failed to sync slots');
        return;
      }

      setSyncResult(data);
      toast.success(
        `Synced: ${data.created} created, ${data.updated} updated, ${data.skipped} skipped`
      );

      setTimeout(() => {
        onOpenChange(false);
        setSlotData('');
        setSyncResult(null);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sync slots');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setSlotData('');
      setSyncResult(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent className="max-w-2xl bg-zinc-800 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-white">Import Slots</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-zinc-400 mb-2">
              One slot per line: <code className="text-amber-400/90">slotId</code>,{' '}
              <code className="text-amber-400/90">startTime</code>,{' '}
              <code className="text-amber-400/90">endTime</code>,{' '}
              <code className="text-amber-400/90">basePrice</code>
            </p>
            <p className="text-xs text-zinc-500 mb-3 font-mono bg-zinc-900 p-2 rounded break-all">
              Example: slot-001, 2026-04-01T10:00:00.000Z, 2026-04-01T11:00:00.000Z, 99.99
            </p>
          </div>

          {!syncResult ? (
            <Textarea
              placeholder={`slot-001, 2026-04-01T10:00:00.000Z, 2026-04-01T11:00:00.000Z, 99.99\nslot-002, 2026-04-01T12:00:00.000Z, 2026-04-01T13:00:00.000Z, 120`}
              value={slotData}
              onChange={(e) => setSlotData(e.target.value)}
              disabled={isLoading}
              className="min-h-48 bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600"
            />
          ) : (
            <div className="space-y-3 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
              <div className="flex items-center gap-3 p-3 bg-emerald-900/30 rounded-lg border border-emerald-900">
                <Check size={20} className="text-emerald-400" />
                <div>
                  <p className="font-medium text-emerald-400">Sync Complete</p>
                  <p className="text-sm text-emerald-300">
                    Created: {syncResult.created} | Updated: {syncResult.updated} | Skipped:{' '}
                    {syncResult.skipped}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600"
            >
              {syncResult ? 'Done' : 'Cancel'}
            </Button>
            {!syncResult && (
              <Button
                onClick={handleSync}
                disabled={isLoading || !slotData.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mr-2" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Import Slots
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

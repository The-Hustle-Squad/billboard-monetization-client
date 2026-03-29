'use client';

import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { toast } from 'sonner';
import { Copy, Check, Clock, Lock, CheckCircle } from 'lucide-react';
import {
  confirmSlot,
  getSlotPricing,
  lockSlot,
} from '@/lib/api';
import type { SlotDocument, SlotPricing, SlotStatus } from '@/lib/types';

function lockExpiresAtMs(slot: SlotDocument): number | null {
  if (!slot.lockedUntil) return null;
  const t = new Date(slot.lockedUntil).getTime();
  return Number.isFinite(t) ? t : null;
}

/** Server says this slot is held by an active lock (for this vendor's API session). */
function hasActiveServerLock(slot: SlotDocument): boolean {
  if (slot.status !== 'locked' || !slot.lockId) return false;
  const until = lockExpiresAtMs(slot);
  return until !== null && until > Date.now();
}

interface SlotDetailPanelProps {
  slot: SlotDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingComplete?: () => void;
}

type BookingStep = 'idle' | 'locking' | 'locked' | 'confirming' | 'confirmed';

function getLockTtlMinutes(): number {
  if (typeof window === 'undefined') return 15;
  const raw = localStorage.getItem('vendor_lock_ttl_minutes');
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 1 ? n : 15;
}

export function SlotDetailPanel({
  slot,
  open,
  onOpenChange,
  onBookingComplete,
}: SlotDetailPanelProps) {
  const [step, setStep] = useState<BookingStep>('idle');
  const [lockId, setLockId] = useState<string>('');
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [pricing, setPricing] = useState<SlotPricing | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  const resetFlow = useCallback(() => {
    setStep('idle');
    setLockId('');
    setLockExpiresAt(null);
    setSecondsLeft(0);
  }, []);

  useEffect(() => {
    if (!open) {
      resetFlow();
      setPricing(null);
      setPricingError(null);
    }
  }, [open, resetFlow]);

  useLayoutEffect(() => {
    if (!open) return;
    resetFlow();
  }, [open, slot.slotId, resetFlow]);

  useLayoutEffect(() => {
    if (!open || !hasActiveServerLock(slot)) return;
    const until = lockExpiresAtMs(slot);
    if (!until) return;
    setLockId(slot.lockId!);
    setLockExpiresAt(until);
    setStep('locked');
  }, [open, slot.slotId, slot.status, slot.lockId, slot.lockedUntil]);

  useEffect(() => {
    const loadPricing =
      open &&
      (slot.status === 'available' || hasActiveServerLock(slot));
    if (!loadPricing) return;

    let cancelled = false;
    setLoadingPricing(true);
    setPricingError(null);

    getSlotPricing(slot.slotId).then(({ data, error }) => {
      if (cancelled) return;
      setLoadingPricing(false);
      if (error || !data) {
        setPricing(null);
        setPricingError(error || 'Could not load pricing');
        return;
      }
      setPricing(data);
    });

    return () => {
      cancelled = true;
    };
  }, [open, slot.slotId, slot.status, slot.lockId, slot.lockedUntil]);

  useEffect(() => {
    if (step !== 'locked' && step !== 'confirming') return;
    if (!lockExpiresAt) return;

    const tick = () => {
      const left = Math.max(0, Math.ceil((lockExpiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        resetFlow();
        toast.error('Lock expired');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [step, lockExpiresAt, resetFlow]);

  const handleLockSlot = async () => {
    if (slot.status !== 'available') {
      toast.error('This slot is not available for booking');
      return;
    }

    setStep('locking');
    const { data, error } = await lockSlot(slot.slotId);

    if (error || !data) {
      setStep('idle');
      toast.error(error || 'Failed to lock slot');
      return;
    }

    const ttlMin = getLockTtlMinutes();
    setLockId(data.lockId);
    setLockExpiresAt(Date.now() + ttlMin * 60 * 1000);
    setSecondsLeft(ttlMin * 60);
    setStep('locked');
    toast.success(`Slot locked for ${ttlMin} minutes`);
  };

  const handleCopyLockId = () => {
    navigator.clipboard.writeText(lockId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmBooking = async () => {
    setStep('confirming');
    const { data, error } = await confirmSlot(slot.slotId, lockId);

    if (error || !data?.success) {
      setStep('locked');
      toast.error(error || 'Confirmation failed');
      return;
    }

    setStep('confirmed');
    toast.success('Booking confirmed!');

    setTimeout(() => {
      onOpenChange(false);
      resetFlow();
      onBookingComplete?.();
    }, 2000);
  };

  const canResumeOrBook =
    slot.status === 'available' || hasActiveServerLock(slot);
  const isSlotUnavailable = !canResumeOrBook;

  const displayStatus: SlotStatus =
    slot.status === 'available' &&
    (step === 'locking' || step === 'locked' || step === 'confirming')
      ? 'locked'
      : slot.status;
  const formatDate = (iso: string) => new Date(iso).toLocaleString();
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-96 bg-zinc-800 border-zinc-700 p-0">
        <SheetHeader className="px-6 py-4 border-b border-zinc-700">
          <SheetTitle className="text-white">Slot Details</SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
          {/* Slot Info */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-zinc-400 font-semibold mb-1">SLOT ID</p>
              <p className="font-mono text-lg font-semibold text-amber-400">{slot.slotId}</p>
            </div>

            <div>
              <p className="text-xs text-zinc-400 font-semibold mb-1">STATUS</p>
              <StatusBadge status={displayStatus} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-400 font-semibold mb-1">START TIME</p>
                <p className="text-sm text-white">{formatDate(slot.startTime)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-semibold mb-1">END TIME</p>
                <p className="text-sm text-white">{formatDate(slot.endTime)}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-700 pt-6">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-400 font-semibold mb-1">BASE PRICE</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(slot.basePrice)}
                </p>
              </div>

              {loadingPricing && canResumeOrBook && (
                <p className="text-sm text-zinc-500">Loading live pricing…</p>
              )}

              {pricingError && canResumeOrBook && (
                <p className="text-sm text-rose-400">{pricingError}</p>
              )}

              {!isSlotUnavailable && step !== 'confirmed' && pricing && (
                <div className="pt-2 border-t border-zinc-700">
                  <p className="text-xs text-emerald-400 font-semibold mb-2">
                    LIVE PRICING (GET /slots/…/pricing)
                  </p>
                  <p className="text-lg font-semibold text-emerald-400">
                    {formatCurrency(pricing.finalPrice)}
                    <span className="text-sm text-zinc-400 ml-2">
                      ({pricing.discountPercent}% off {formatCurrency(pricing.originalPrice)})
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Valid until {formatDate(pricing.validUntil)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Flow */}
          {!isSlotUnavailable && (
            <div className="space-y-4 pt-6 border-t border-zinc-700">
              {step === 'idle' && (
                <Button
                  onClick={handleLockSlot}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold py-6"
                >
                  <Lock size={18} />
                  Lock slot
                </Button>
              )}

              {step === 'locking' && (
                <Button disabled className="w-full bg-zinc-700 text-white py-6">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Locking Slot...
                </Button>
              )}

              {(step === 'locked' || step === 'confirming' || step === 'confirmed') && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-900 space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">
                        Lock expires in {mm}:{ss.toString().padStart(2, '0')}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-blue-300 font-semibold mb-2">LOCK ID</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-zinc-900 rounded border border-zinc-700 text-xs font-mono text-amber-400 break-all">
                          {lockId}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyLockId}
                          className="p-2 hover:bg-zinc-700 rounded transition-colors"
                        >
                          {copied ? (
                            <Check size={16} className="text-emerald-400" />
                          ) : (
                            <Copy size={16} className="text-blue-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {step === 'locked' && (
                    <Button
                      onClick={handleConfirmBooking}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6"
                    >
                      <CheckCircle size={18} />
                      Confirm booking
                    </Button>
                  )}

                  {step === 'confirming' && (
                    <Button disabled className="w-full bg-zinc-700 text-white py-6">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Confirming...
                    </Button>
                  )}

                  {step === 'confirmed' && (
                    <div className="p-4 bg-emerald-900/30 rounded-lg border border-emerald-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={20} className="text-emerald-400" />
                        <div>
                          <p className="font-semibold text-emerald-400">Booking Confirmed!</p>
                          {pricing && (
                            <p className="text-sm text-emerald-300">
                              Final price: {formatCurrency(pricing.finalPrice)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isSlotUnavailable && (
            <div className="p-4 bg-rose-900/30 rounded-lg border border-rose-900">
              <p className="text-sm text-rose-400">
                This slot is not available for booking. Please select an available slot.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

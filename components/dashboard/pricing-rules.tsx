'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, Save } from 'lucide-react';
import { updateVendorRules } from '@/lib/api';
import type { DiscountBucketDto } from '@/lib/types';

type RulesState = {
  vacancyThresholdHours: number;
  maxDiscountPercent: number;
  minPrice: number;
  lockTtlMinutes: number;
  discountBuckets: DiscountBucketDto[];
};

/** Server defaults when creating a vendor (use until first successful POST /vendors/rules) */
const DEFAULT_RULES: RulesState = {
  vacancyThresholdHours: 72,
  maxDiscountPercent: 100,
  minPrice: 0,
  lockTtlMinutes: 15,
  discountBuckets: [],
};

export function PricingRulesTab() {
  const [rules, setRules] = useState<RulesState>(() => ({ ...DEFAULT_RULES }));
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateRule = <K extends keyof RulesState>(field: K, value: RulesState[K]) => {
    setRules(prev => ({ ...prev, [field]: value }));
  };

  const handleAddBucket = () => {
    const newBucket: DiscountBucketDto = {
      hoursBefore: 1,
      discountPercent: 0,
    };
    setRules(prev => ({
      ...prev,
      discountBuckets: [...prev.discountBuckets, newBucket],
    }));
  };

  const handleRemoveBucket = (index: number) => {
    setRules(prev => ({
      ...prev,
      discountBuckets: prev.discountBuckets.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateBucket = (index: number, field: keyof DiscountBucketDto, value: number) => {
    setRules(prev => {
      const buckets = [...prev.discountBuckets];
      buckets[index] = { ...buckets[index], [field]: value };
      return { ...prev, discountBuckets: buckets };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await updateVendorRules({
        vacancyThresholdHours: rules.vacancyThresholdHours,
        discountBuckets: rules.discountBuckets,
        maxDiscountPercent: rules.maxDiscountPercent,
        minPrice: rules.minPrice,
        lockTtlMinutes: rules.lockTtlMinutes,
      });

      if (error || !data) {
        toast.error(error || 'Failed to save pricing rules');
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('vendor_lock_ttl_minutes', String(data.lockTtlMinutes));
      }

      setRules({
        vacancyThresholdHours: data.vacancyThresholdHours,
        maxDiscountPercent: data.maxDiscountPercent,
        minPrice: data.minPrice,
        lockTtlMinutes: data.lockTtlMinutes,
        discountBuckets: [...data.discountBuckets],
      });

      toast.success('Pricing rules saved successfully!');
    } catch {
      toast.error('Failed to save pricing rules');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Main Settings */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white">General Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vacancy Threshold Hours */}
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-2">
              Vacancy Threshold Hours
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              Hours before slot end to trigger dynamic pricing
            </p>
            <Input
              type="number"
              min={1}
              max={168}
              value={rules.vacancyThresholdHours}
              onChange={(e) =>
                handleUpdateRule('vacancyThresholdHours', parseInt(e.target.value, 10) || 1)
              }
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>

          {/* Max Discount Percent */}
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-2">
              Max Discount Percent
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              Maximum discount allowed (0-100%)
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="range"
                min="0"
                max="100"
                value={rules.maxDiscountPercent}
                onChange={(e) =>
                  handleUpdateRule('maxDiscountPercent', parseInt(e.target.value, 10))
                }
                className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-semibold text-amber-400 min-w-12">
                {rules.maxDiscountPercent}%
              </span>
            </div>
          </div>

          {/* Min Price */}
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-2">
              Minimum Price Floor
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              Lowest price allowed after discounts
            </p>
            <div className="relative">
              <span className="absolute left-3 top-3 text-zinc-400">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={rules.minPrice}
                onChange={(e) =>
                  handleUpdateRule('minPrice', parseFloat(e.target.value) || 0)
                }
                className="bg-zinc-900 border-zinc-700 text-white pl-7"
              />
            </div>
          </div>

          {/* Lock TTL */}
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-2">
              Lock TTL Minutes
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              How long a slot lock remains valid
            </p>
            <Input
              type="number"
              min={1}
              max={1440}
              value={rules.lockTtlMinutes}
              onChange={(e) =>
                handleUpdateRule('lockTtlMinutes', parseInt(e.target.value, 10) || 1)
              }
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
        </div>
      </div>

      {/* Discount Buckets */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Discount Buckets</h3>
          <Button
            onClick={handleAddBucket}
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
          >
            <Plus size={16} />
            Add Bucket
          </Button>
        </div>

        <p className="text-sm text-zinc-400">
          Discount percentages by <code className="text-amber-400/90">hoursBefore</code> (hours
          before slot end)
        </p>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {rules.discountBuckets.map((bucket, index) => (
            <div
              key={index}
              className="flex items-end gap-3 p-4 bg-zinc-900 rounded-lg border border-zinc-700"
            >
              <div className="flex-1">
                <label className="text-xs font-medium text-zinc-400 block mb-2">
                  Hours before end
                </label>
                <Input
                  type="number"
                  min={0.5}
                  step="0.5"
                  value={bucket.hoursBefore}
                  onChange={(e) =>
                    handleUpdateBucket(index, 'hoursBefore', parseFloat(e.target.value) || 0.5)
                  }
                  className="bg-zinc-800 border-zinc-700 text-white text-sm"
                  placeholder="e.g., 6"
                />
              </div>

              <div className="flex-1">
                <label className="text-xs font-medium text-zinc-400 block mb-2">
                  Discount %
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={bucket.discountPercent}
                    onChange={(e) =>
                      handleUpdateBucket(
                        index,
                        'discountPercent',
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="bg-zinc-800 border-zinc-700 text-white text-sm"
                    placeholder="e.g., 10"
                  />
                  <span className="text-zinc-400 text-sm">%</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveBucket(index)}
                className="p-2 hover:bg-zinc-700 rounded transition-colors text-rose-400"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {rules.discountBuckets.length === 0 && (
          <div className="text-center py-8 text-zinc-400">
            <p>No discount buckets configured</p>
            <p className="text-xs mt-2">Click &quot;Add Bucket&quot; to get started</p>
          </div>
        )}
      </div>

      {/* Pricing Preview */}
      <div className="bg-blue-900/20 rounded-lg border border-blue-900 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-blue-400">Pricing Preview</h3>
        <div className="space-y-2 text-sm">
          <p className="text-blue-300">
            Slots within <strong>{rules.vacancyThresholdHours} hours</strong> of end time will be
            eligible for discounts
          </p>
          <p className="text-blue-300">
            Maximum discount applied: <strong>{rules.maxDiscountPercent}%</strong>
          </p>
          <p className="text-blue-300">
            Minimum price floor: <strong>${rules.minPrice}</strong>
          </p>
          <p className="text-blue-300">
            Lock validity: <strong>{rules.lockTtlMinutes} minutes</strong>
          </p>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold py-6"
      >
        {isSaving ? (
          <>
            <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mr-2" />
            Saving...
          </>
        ) : (
          <>
            <Save size={18} />
            Save Pricing Rules
          </>
        )}
      </Button>
    </div>
  );
}

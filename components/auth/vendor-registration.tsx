'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { createVendor, setApiKey } from '@/lib/api';
import type { CreateVendorDto } from '@/lib/types';

interface VendorRegistrationProps {
  onSuccess?: () => void;
}

export function VendorRegistration({ onSuccess }: VendorRegistrationProps) {
  const [step, setStep] = useState<'form' | 'api-key'>('form');
  const [vendorName, setVendorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKeyState] = useState('');
  const [copied, setCopied] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendorName.trim()) {
      toast.error('Please enter your vendor name');
      return;
    }

    setIsLoading(true);
    try {
      const body: CreateVendorDto = {
        name: vendorName.trim(),
      };

      const { data, error } = await createVendor(body);

      if (error || !data) {
        toast.error(error || 'Failed to create account');
        return;
      }

      setApiKeyState(data.apiKey);
      setApiKey(data.apiKey);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vendor_lock_ttl_minutes', String(data.lockTtlMinutes));
      }

      setStep('api-key');
      toast.success('Account created successfully!');
    } catch {
      toast.error('Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinueDashboard = () => {
    onSuccess?.();
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-amber-400 mb-2">VacantSlot</h1>
          <p className="text-zinc-400">Billboard Advertising Platform</p>
        </div>

        {step === 'form' ? (
          /* Registration Form */
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-sm text-zinc-400">
                Register your vendor account to get started (POST /api/v1/vendors — server applies
                defaults for optional pricing fields)
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-2">
                  Vendor Name
                </label>
                <Input
                  type="text"
                  placeholder="Your company name"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  disabled={isLoading}
                  className="bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-2">
                  Email (optional)
                </label>
                <Input
                  type="email"
                  placeholder="contact@company.com"
                  disabled={isLoading}
                  className="bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold py-6 mt-6"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-zinc-700">
              <p className="text-xs text-zinc-500 text-center">
                By registering, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        ) : (
          /* API Key Display */
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-8 space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
              <p className="text-sm text-zinc-400">
                Your account has been created
              </p>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-900/30 border border-amber-900 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm">
                <p className="font-semibold text-amber-400 mb-1">Save Your API Key</p>
                <p className="text-amber-300/80">
                  You will not be able to see this key again. Save it somewhere safe.
                </p>
              </div>
            </div>

            {/* API Key Display */}
            <div>
              <p className="text-xs text-zinc-400 font-semibold mb-2">API KEY</p>
              <div className="flex items-center gap-2 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
                <code className="flex-1 font-mono text-amber-400 text-xs break-all">
                  {apiKey}
                </code>
                <button
                  onClick={handleCopyApiKey}
                  className="p-2 hover:bg-zinc-700 rounded transition-colors flex-shrink-0"
                >
                  {copied ? (
                    <Check size={18} className="text-emerald-400" />
                  ) : (
                    <Copy size={18} className="text-zinc-400" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                  <Check size={14} />
                  Copied to clipboard
                </p>
              )}
            </div>

            {/* Usage Instructions */}
            <div className="bg-blue-900/20 border border-blue-900 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-400">How to use your API key:</p>
              <ol className="text-sm text-blue-300 space-y-2 list-decimal list-inside">
                <li>Send it in the <code className="text-amber-300/90">x-api-key</code> header on all routes except POST /vendors</li>
                <li>Keep it secure and never share it publicly</li>
              </ol>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinueDashboard}
              className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold py-6"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

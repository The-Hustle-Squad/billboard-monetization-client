'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Check, AlertCircle, KeyRound } from 'lucide-react';
import { createVendor, setApiKey, verifyApiKey } from '@/lib/api';
import type { CreateVendorDto } from '@/lib/types';

interface VendorRegistrationProps {
  onSuccess?: () => void;
}

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function looksLikeUuidV4(value: string): boolean {
  return UUID_V4_RE.test(value.trim());
}

export function VendorRegistration({ onSuccess }: VendorRegistrationProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registerStep, setRegisterStep] = useState<'form' | 'api-key'>('form');

  const [vendorName, setVendorName] = useState('');
  const [loginApiKey, setLoginApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newApiKey, setNewApiKeyState] = useState('');
  const [copied, setCopied] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = loginApiKey.trim();
    if (!key) {
      toast.error('Paste your API key');
      return;
    }
    if (!looksLikeUuidV4(key)) {
      toast.error('API key should be a UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await verifyApiKey(key);
      if (error || !data) {
        toast.error(error || 'Invalid API key');
        return;
      }

      setApiKey(key);
      toast.success('Signed in');
      onSuccess?.();
    } catch {
      toast.error('Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

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

      setNewApiKeyState(data.apiKey);
      setApiKey(data.apiKey);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vendor_lock_ttl_minutes', String(data.lockTtlMinutes));
      }

      setRegisterStep('api-key');
      toast.success('Account created successfully!');
    } catch {
      toast.error('Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(newApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinueDashboard = () => {
    onSuccess?.();
  };

  const switchToRegister = () => {
    setMode('register');
    setRegisterStep('form');
  };

  const switchToLogin = () => {
    setMode('login');
    setRegisterStep('form');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-amber-400 mb-2">VacantSlot</h1>
          <p className="text-zinc-400">Billboard Advertising Platform</p>
        </div>

        {mode === 'login' && (
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <KeyRound className="text-amber-400" size={26} />
                Sign in
              </h2>
              <p className="text-sm text-zinc-400">
                Paste the API key you received when you registered. It is sent as the{' '}
                <code className="text-amber-400/90">x-api-key</code> header.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-2">
                  API key
                </label>
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder="xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx"
                  value={loginApiKey}
                  onChange={(e) => setLoginApiKey(e.target.value)}
                  disabled={isLoading}
                  className="bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 font-mono text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold py-6"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mr-2" />
                    Verifying…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-zinc-500">
              New vendor?{' '}
              <button
                type="button"
                onClick={switchToRegister}
                className="text-amber-400 hover:text-amber-300 font-medium"
              >
                Create an account
              </button>
            </p>
          </div>
        )}

        {mode === 'register' && registerStep === 'form' && (
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Create account</h2>
              <p className="text-sm text-zinc-400">
                Register to receive an API key. Optional pricing fields use server defaults.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-2">
                  Vendor name
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold py-6 mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mr-2" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-zinc-500 pt-2 border-t border-zinc-700">
              Already have a key?{' '}
              <button
                type="button"
                onClick={switchToLogin}
                className="text-amber-400 hover:text-amber-300 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        )}

        {mode === 'register' && registerStep === 'api-key' && (
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-8 space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
              <p className="text-sm text-zinc-400">Your account has been created</p>
            </div>

            <div className="bg-amber-900/30 border border-amber-900 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm">
                <p className="font-semibold text-amber-400 mb-1">Save your API key</p>
                <p className="text-amber-300/80">
                  You will not see this key again from the server. Store it safely; use it to sign in
                  here or in the <code className="text-amber-200/90">x-api-key</code> header.
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-zinc-400 font-semibold mb-2">API KEY</p>
              <div className="flex items-center gap-2 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
                <code className="flex-1 font-mono text-amber-400 text-xs break-all">
                  {newApiKey}
                </code>
                <button
                  type="button"
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

            <div className="bg-blue-900/20 border border-blue-900 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-400">Next steps</p>
              <ol className="text-sm text-blue-300 space-y-2 list-decimal list-inside">
                <li>Save the key somewhere secure</li>
                <li>Use Sign in on this page if you return on a new device</li>
              </ol>
            </div>

            <Button
              onClick={handleContinueDashboard}
              className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold py-6"
            >
              Go to dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

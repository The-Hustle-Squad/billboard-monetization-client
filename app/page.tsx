'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { OverviewTab } from '@/components/dashboard/overview';
import { SlotsManagerTab } from '@/components/dashboard/slots-manager';
import { PricingRulesTab } from '@/components/dashboard/pricing-rules';
import { VendorRegistration } from '@/components/auth/vendor-registration';
import { getApiKey } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for API key on mount and when cleared after 401
  useEffect(() => {
    const sync = () => {
      setIsLoggedIn(!!getApiKey());
      setIsLoading(false);
    };
    sync();

    const onUnauthorized = () => {
      setIsLoggedIn(false);
    };
    window.addEventListener('vacantslot:unauthorized', onUnauthorized);
    return () => window.removeEventListener('vacantslot:unauthorized', onUnauthorized);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <div className="mb-4 text-amber-400">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show vendor registration if not logged in
  if (!isLoggedIn) {
    return <VendorRegistration onSuccess={() => setIsLoggedIn(true)} />;
  }

  // Main dashboard layout with sidebar
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className={`${isMobile ? '' : 'ml-64'}`}>
        {activeTab === 'dashboard' && (
          <>
            <Header
              title="Dashboard"
              subtitle="Overview of your advertising slots and performance"
            />
            <div className="p-6 max-w-7xl mx-auto">
              <OverviewTab />
            </div>
          </>
        )}

        {activeTab === 'slots' && (
          <>
            <Header
              title="Slots Manager"
              subtitle="Manage and monitor your advertising slots"
            />
            <div className="p-6 max-w-7xl mx-auto">
              <SlotsManagerTab />
            </div>
          </>
        )}

        {activeTab === 'pricing' && (
          <>
            <Header
              title="Pricing Rules"
              subtitle="Configure your dynamic pricing and discount rules"
            />
            <div className="p-6 max-w-7xl mx-auto">
              <PricingRulesTab />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

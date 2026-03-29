'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Grid3X3,
  Settings,
  UserCheck,
  LogOut,
  Menu,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearApiKey, getApiKey } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setApiKey(getApiKey());
  }, []);

  const handleLogout = () => {
    clearApiKey();
    setApiKey(null);
    router.push('/');
  };

  const handleCopyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'slots', label: 'Slots Manager', icon: Grid3X3 },
    { id: 'pricing', label: 'Pricing Rules', icon: Settings },
  ];

  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
    if (isMobile) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-800 text-amber-400 hover:bg-zinc-700"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-transform duration-300 z-40 ${
          isMobile && !isOpen ? '-translate-x-full' : ''
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-zinc-800">
          <div className="text-2xl font-bold text-amber-400">VacantSlot</div>
          <p className="text-sm text-zinc-400 mt-1">Advertisement Platform</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber-400 text-zinc-900 font-medium'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-amber-400'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* API Key Section */}
        {apiKey && (
          <div className="p-4 border-t border-zinc-800 space-y-3">
            <div className="text-xs text-zinc-400 font-semibold">API KEY</div>
            <div className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between">
              <code className="text-xs text-amber-400 truncate">{apiKey.substring(0, 16)}...</code>
              <button
                onClick={handleCopyApiKey}
                className="ml-2 p-1 hover:bg-zinc-700 rounded transition-colors"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-zinc-400" />}
              </button>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="p-4 border-t border-zinc-800">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

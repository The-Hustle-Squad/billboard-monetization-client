'use client';

import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'pl-0 pt-16 px-4' : 'pl-64'} bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30`}>
      <div className="px-6 py-6">
        <h1 className="text-3xl font-bold text-white text-balance">{title}</h1>
        {subtitle && <p className="text-zinc-400 mt-2 text-sm">{subtitle}</p>}
      </div>
    </div>
  );
}

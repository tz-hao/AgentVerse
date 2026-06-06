'use client';

import { useSidebar } from '@/components/providers/AppProvider';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <main
      className={`transition-all duration-300 pt-16 pb-14 ${collapsed ? 'ml-[72px]' : 'ml-[220px]'}`}
    >
      {children}
    </main>
  );
}

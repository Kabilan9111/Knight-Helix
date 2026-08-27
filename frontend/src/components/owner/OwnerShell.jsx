import React from 'react';
import OwnerSidebar from './OwnerSidebar';

export default function OwnerShell({ children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-[#1e1e38]/50 bg-[#0B0F19]">
        <OwnerSidebar />
      </div>
      <div className="theme-light flex-1 flex flex-col min-w-0 bg-[#F8FAFC] text-[var(--text-primary)]">
        {children}
      </div>
    </div>
  );
}

import React from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="theme-sidebar w-64 flex-shrink-0 flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] border-r border-[var(--border-subtle)]">
        <Sidebar />
      </div>
      <div className="theme-light flex-1 flex flex-col min-w-0 bg-[var(--bg-base)] text-[var(--text-primary)]">
        {children}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div 
        className={`theme-sidebar flex-shrink-0 flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] border-r border-[var(--border-subtle)] transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>
      <div className="theme-light flex-1 flex flex-col min-w-0 bg-[var(--bg-base)] text-[var(--text-primary)] relative">
        {children}
      </div>
    </div>
  );
}

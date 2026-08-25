import React from 'react';
import { Search, Bell, Command } from 'lucide-react';

export default function TopHeader({ title, subtitle, rightElement }) {
  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-[var(--border-subtle)] bg-[rgba(11,15,25,0.7)] backdrop-blur-xl sticky top-0 z-20">
      
      <div>
        <h2 className="text-h2 text-[var(--text-primary)]">{title}</h2>
        {subtitle && <p className="text-body-small text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-6">
        
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 text-[var(--text-tertiary)]" size={14} />
          <input 
            type="text" 
            placeholder="Search projects, tasks, workers..." 
            className="w-72 pl-9 pr-12 py-1.5 bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-[4px] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-focus)] focus:bg-[var(--bg-surface-3)] transition-all duration-200 shadow-sm"
          />
          <div className="absolute right-2 flex items-center gap-1">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-medium text-[var(--text-tertiary)] bg-[var(--bg-surface-1)] border border-[var(--border-medium)] rounded-[3px] shadow-sm"><Command size={10} className="inline mr-0.5 -mt-0.5" />K</kbd>
          </div>
        </div>
        
        <div className="flex items-center gap-4 border-r border-[var(--border-medium)] pr-6">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-[4px] shadow-sm cursor-default">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)] shadow-[0_0_8px_var(--status-success)]"></span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">Operational</span>
          </div>
          
          <button className="relative p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[var(--status-critical)] rounded-full shadow-[0_0_5px_var(--status-critical)]"></span>
          </button>
        </div>

        {rightElement}
      </div>
    </header>
  );
}

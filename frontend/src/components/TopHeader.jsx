import React from 'react';
import { Menu, Search, Bell, HelpCircle, RefreshCw } from 'lucide-react';

export default function TopHeader() {
  return (
    <div className="h-16 flex items-center justify-between px-6 bg-[var(--bg-surface-1)] border-b border-[var(--border-subtle)]">
      
      <div className="flex items-center gap-6 flex-1">
        <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <Menu size={20} />
        </button>
        
        <div className="relative w-full max-w-xl hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-[var(--text-tertiary)]" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-16 py-2 border border-[var(--border-medium)] rounded-lg leading-5 bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] sm:text-sm transition-colors"
            placeholder="Search projects, activities, tasks, workers..."
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <span className="text-xs font-semibold text-[var(--text-tertiary)] bg-[var(--bg-surface-1)] border border-[var(--border-medium)] rounded px-1.5 py-0.5">
              Ctrl + K
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        
        <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Live Data
          </div>
          <div>Last updated: 14:32:45</div>
          <button className="hover:text-[var(--text-primary)] transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="w-px h-6 bg-[var(--border-medium)] hidden lg:block"></div>

        <div className="flex items-center gap-4">
          <button className="relative text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-[var(--bg-surface-1)]">
              5
            </span>
          </button>
          <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <HelpCircle size={20} />
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm">
              A
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-bold leading-none text-[var(--text-primary)]">Admin</div>
              <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5 font-medium">Super Admin</div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

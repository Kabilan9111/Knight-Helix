import React from 'react';
import { RefreshCw, Map as MapIcon, Info } from 'lucide-react';

export default function WeatherStatusBar({ isLive, lastUpdated, onRefresh, isRefreshing, error }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-surface-1)] border border-[var(--border-medium)] rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30">
          <MapIcon size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white leading-tight">Weather Intelligence Map</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${
              isLive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></div>
              {isLive ? 'Live Data' : 'Demo Data'}
            </div>
            
            {lastUpdated && (
              <span className="text-[11px] text-[var(--text-tertiary)]">
                Last Updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto">
        {error && (
          <div className="flex items-center gap-2 text-[11px] text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
            <Info size={14} />
            <span>{error}</span>
          </div>
        )}
        
        <button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-medium)] text-[var(--text-secondary)] hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all ml-auto"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[var(--accent-primary)]' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}

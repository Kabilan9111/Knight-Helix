import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KpiCard({ label, value, trend, trendValue, icon: Icon, colorClass = 'text-[var(--text-primary)]' }) {
  
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={12} className="text-[var(--status-success)]" />;
    if (trend === 'down') return <TrendingDown size={12} className="text-[var(--status-critical)]" />;
    return <Minus size={12} className="text-[var(--text-tertiary)]" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-[var(--status-success)]';
    if (trend === 'down') return 'text-[var(--status-critical)]';
    return 'text-[var(--text-tertiary)]';
  };

  return (
    <div className="card p-5 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-[var(--bg-surface-3)] opacity-0 group-hover:opacity-50 transition-all duration-500 blur-xl pointer-events-none"></div>

      <div className="flex justify-between items-start mb-3 relative z-10">
        <span className="text-caption text-[var(--text-secondary)]">{label}</span>
        {Icon && (
          <div className="text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] transition-colors duration-300">
            <Icon size={14} />
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <div className={`text-3xl text-metric tracking-tight mb-2 ${colorClass}`}>
          {value}
        </div>
        
        <div className="flex items-center gap-1.5">
          {getTrendIcon()}
          <span className={`text-[10px] font-medium ${getTrendColor()}`}>
            {trendValue || 'Stable'}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)]">vs last week</span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function KpiCard({ title, value, trend, trendLabel, icon: Icon, colorClass, bgColorClass, isPositive }) {
  return (
    <div className="card p-5 flex items-center gap-4 bg-white hover:border-[var(--border-strong)] transition-all">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${bgColorClass} ${colorClass}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <div className="text-sm font-semibold text-[var(--text-secondary)] mb-1">{title}</div>
        <div className="text-3xl font-bold text-[var(--text-primary)] mb-1 leading-none">{value}</div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {isPositive ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />}
          <span>{trend} {trendLabel}</span>
        </div>
      </div>
    </div>
  );
}

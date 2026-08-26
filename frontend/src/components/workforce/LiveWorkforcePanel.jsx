import React from 'react';
import { MapPin, Navigation, NavigationOff } from 'lucide-react';

const getWorkerStatus = (timestamp) => {
  if (!timestamp) return 'OFFLINE';
  const diffSeconds = (new Date() - new Date(timestamp)) / 1000;
  if (diffSeconds < 30) return 'LIVE';
  if (diffSeconds < 120) return 'STALE';
  return 'OFFLINE';
};

export default function LiveWorkforcePanel({ workers, onSelectWorker, focusedWorkerId }) {
  const liveCount = workers.filter(w => getWorkerStatus(w.timestamp) === 'LIVE').length;
  const offlineCount = workers.length - liveCount;

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-surface-1)] rounded-xl border border-[var(--border-medium)] overflow-hidden">
      <div className="p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]">
        <h2 className="text-[16px] font-bold text-white tracking-wide">LIVE WORKFORCE</h2>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Real-time location of active workers</p>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="text-center bg-[var(--bg-surface-1)] p-2 rounded-lg border border-[var(--border-subtle)] flex-1">
            <div className="text-lg font-bold text-white">{workers.length}</div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Total</div>
          </div>
          <div className="text-center bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 flex-1">
            <div className="text-lg font-bold text-emerald-400">{liveCount}</div>
            <div className="text-[10px] text-emerald-600 uppercase font-semibold">Live</div>
          </div>
          <div className="text-center bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 flex-1">
            <div className="text-lg font-bold text-amber-400">{offlineCount}</div>
            <div className="text-[10px] text-amber-600 uppercase font-semibold">Offline</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
        {workers.map((worker) => {
          const status = getWorkerStatus(worker.timestamp);
          const isSelected = focusedWorkerId === worker.workerId;
          const isLive = status === 'LIVE';
          
          return (
            <button
              key={worker.workerId}
              onClick={() => onSelectWorker(worker.workerId)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 border flex flex-col gap-3 group
                ${isSelected 
                  ? 'bg-[var(--accent-primary-subtle)] border-[var(--accent-primary)] shadow-[0_0_15px_rgba(124,58,237,0.15)]' 
                  : 'bg-[var(--bg-surface-2)] border-[var(--border-subtle)] hover:border-[var(--accent-primary-muted)] hover:bg-[var(--bg-surface-3)]'
                }
              `}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface-1)] flex items-center justify-center p-1 border border-[var(--border-medium)] shadow-inner text-indigo-400 font-bold text-lg">
                    {worker.workerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className={`font-semibold text-[15px] leading-tight ${isSelected ? 'text-[var(--accent-primary-light)]' : 'text-white'}`}>
                      {worker.workerName}
                    </h3>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 font-mono">
                      {worker.workerId}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    isLive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    status === 'STALE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                    'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                  }`}>
                    {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                    {status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1 pt-3 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                  <MapPin size={12} className={isSelected ? 'text-[var(--accent-primary-light)]' : 'text-[var(--text-tertiary)]'} />
                  <span>Lat: {worker.latitude.toFixed(2)} Lon: {worker.longitude.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] justify-end text-right">
                  <span>{Math.floor((new Date() - new Date(worker.timestamp)) / 1000)}s ago</span>
                </div>
              </div>
            </button>
          );
        })}

        {workers.length === 0 && (
          <div className="text-center py-10">
            <NavigationOff size={32} className="mx-auto text-[var(--text-tertiary)] mb-3" />
            <p className="text-[var(--text-secondary)] text-sm font-medium">No active workers tracking location</p>
          </div>
        )}
      </div>
    </div>
  );
}

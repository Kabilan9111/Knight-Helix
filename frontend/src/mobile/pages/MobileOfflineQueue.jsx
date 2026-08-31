import React, { useState, useEffect } from 'react';
import { useMobileAuth } from '../context/MobileAuthContext';
import { 
  getOutboxItems, removeOutboxItem, getLocalGpsTraces, getStorageStats 
} from '../../services/mobileOfflineStore';
import { 
  Wifi, WifiOff, RefreshCw, Trash2, CheckCircle2, 
  AlertTriangle, Clock, Database, ArrowRight, ShieldCheck, Camera, Navigation
} from 'lucide-react';

export default function MobileOfflineQueue() {
  const { isOnline, isSyncing, triggerSync, token } = useMobileAuth();
  const [outboxItems, setOutboxItems] = useState([]);
  const [gpsTraces, setGpsTraces] = useState([]);
  const [stats, setStats] = useState({ tasksCount: 0, outboxCount: 0, tracesCount: 0 });
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    try {
      const items = await getOutboxItems();
      const traces = await getLocalGpsTraces();
      const s = await getStorageStats();
      setOutboxItems(items || []);
      setGpsTraces(traces || []);
      setStats(s);
    } catch (e) {
      console.warn('Queue load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [isSyncing]);

  const handleDeleteItem = async (id) => {
    await removeOutboxItem(id);
    loadQueue();
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
            <Database size={16} />
            <span>IndexedDB Offline Engine</span>
          </div>
          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase flex items-center gap-1 ${
            isOnline ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' : 'bg-amber-950 text-amber-400 border-amber-500/40 animate-pulse'
          }`}>
            {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          When field internet is unavailable, SANCHALAN safely caches your evidence photos, DPR descriptions, and real GPS walk traces locally. Operations are synced automatically when connectivity returns.
        </p>

        {/* Sync Controls */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center text-xs">
          <div className="bg-slate-950 p-2 rounded-xl">
            <div className="text-[9px] uppercase font-bold text-slate-400">Cached Tasks</div>
            <div className="text-sm font-black text-blue-400 mt-0.5">{stats.tasksCount}</div>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl">
            <div className="text-[9px] uppercase font-bold text-slate-400">Outbox Queue</div>
            <div className="text-sm font-black text-amber-400 mt-0.5">{stats.outboxCount}</div>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl">
            <div className="text-[9px] uppercase font-bold text-slate-400">Local Traces</div>
            <div className="text-sm font-black text-emerald-400 mt-0.5">{stats.tracesCount}</div>
          </div>
        </div>

        {/* Force Sync Action Button */}
        {isOnline && stats.outboxCount > 0 && (
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Synchronizing Outbox...' : 'Force Synchronize Outbox Now'}
          </button>
        )}
      </div>

      {/* Pending Outbox Items List */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Pending Outbox Items ({outboxItems.length})
        </h3>

        {outboxItems.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-xs">
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2 opacity-60" />
            Outbox is clear. All field updates are in sync with the SANCHALAN server.
          </div>
        ) : (
          outboxItems.map(item => (
            <div 
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/40 flex items-center gap-1">
                  {item.type === 'EVIDENCE_SUBMISSION' ? <Camera size={10} /> : <Navigation size={10} />}
                  {item.type}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded uppercase ${
                  item.status === 'SYNCING' ? 'bg-indigo-950 text-indigo-300 animate-pulse' :
                  item.status === 'FAILED' ? 'bg-red-950 text-red-300' :
                  'bg-amber-950 text-amber-300'
                }`}>
                  {item.status}
                </span>
              </div>

              <div className="text-slate-200 font-medium">
                {item.payload?.description || item.payload?.activityId || 'Field update'}
              </div>

              {item.lastError && (
                <div className="p-2 bg-red-950/60 border border-red-500/30 rounded-lg text-red-300 text-[10px]">
                  Error: {item.lastError}
                </div>
              )}

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                <span>Queued: {new Date(item.createdAt).toLocaleTimeString()}</span>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 font-bold"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

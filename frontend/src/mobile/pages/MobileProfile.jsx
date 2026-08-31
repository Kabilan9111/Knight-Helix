import React, { useState } from 'react';
import { useMobileAuth } from '../context/MobileAuthContext';
import { 
  User, ShieldCheck, HardHat, Crown, Wifi, 
  Database, Trash2, LogOut, CheckCircle2, RefreshCw, Key
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MobileProfile() {
  const { user, token, isOnline, outboxCount, quickSwitchRole, logout } = useMobileAuth();
  const navigate = useNavigate();
  const [clearing, setClearing] = useState(false);
  const [clearedMsg, setClearedMsg] = useState(false);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      indexedDB.deleteDatabase('sanchalan_mobile_db');
      setClearedMsg(true);
      setTimeout(() => setClearedMsg(false), 3000);
    } catch (e) {
      console.warn('Cache clear error:', e);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-200">
      
      {/* Profile Header Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20">
          {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SC'}
        </div>
        <div>
          <h2 className="text-base font-black text-white">{user?.name || 'Site Engineer'}</h2>
          <p className="text-xs text-slate-400 font-mono">User ID: {user?.id || 'N/A'}</p>
          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-600/40">
            {user?.role || 'SITE_ENGINEER'}
          </span>
        </div>
      </div>

      {/* Role Switcher Matrix */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Quick Demo Role Switcher
        </h3>
        
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => quickSwitchRole('ADMIN')}
            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
              user?.role === 'ADMIN' ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <ShieldCheck size={18} className="text-emerald-400" />
            <span className="text-[11px] font-bold">Site Engineer</span>
          </button>

          <button
            onClick={() => quickSwitchRole('WORKER')}
            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
              user?.role === 'WORKER' ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <HardHat size={18} className="text-amber-400" />
            <span className="text-[11px] font-bold">Supervisor</span>
          </button>

          <button
            onClick={() => quickSwitchRole('OWNER')}
            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
              user?.role === 'OWNER' ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <Crown size={18} className="text-purple-400" />
            <span className="text-[11px] font-bold">Owner</span>
          </button>
        </div>
      </div>

      {/* Storage & Device Diagnostics */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Database size={14} className="text-blue-400" />
          Device Storage & Offline Cache
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
            <span className="text-slate-400">Network Connectivity:</span>
            <span className={`font-bold ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isOnline ? 'Online (Connected)' : 'Offline (No Connection)'}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
            <span className="text-slate-400">Pending Outbox Items:</span>
            <span className="font-bold text-amber-400">{outboxCount} items</span>
          </div>

          <div className="flex justify-between py-1.5 text-slate-300">
            <span className="text-slate-400">Local Database:</span>
            <span className="font-mono text-slate-200">sanchalan_mobile_db (v1)</span>
          </div>
        </div>

        {clearedMsg && (
          <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl text-center font-bold">
            ✓ Local IndexedDB cache cleared!
          </div>
        )}

        <button
          onClick={handleClearCache}
          disabled={clearing}
          className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <Trash2 size={14} /> Clear Local Cache
        </button>
      </div>

      {/* Logout Button */}
      <button
        onClick={() => { logout(); navigate('/mobile/login'); }}
        className="w-full py-4 bg-red-950/60 border border-red-500/40 text-red-300 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md hover:bg-red-900/60"
      >
        <LogOut size={16} /> Sign Out of Mobile
      </button>

    </div>
  );
}

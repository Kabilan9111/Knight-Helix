import React, { useState } from 'react';
import { useMobileAuth } from '../context/MobileAuthContext';
import { 
  ShieldCheck, HardHat, Crown, Wifi, WifiOff, RefreshCw, 
  ChevronDown, User, LogOut, CheckCircle2, AlertCircle, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MobileHeader({ title = 'SANCHALAN' }) {
  const { user, isOnline, outboxCount, isSyncing, triggerSync, quickSwitchRole, logout } = useMobileAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const navigate = useNavigate();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
      case 'SITE_ENGINEER':
        return {
          label: 'Site Engineer',
          icon: <ShieldCheck size={14} className="text-emerald-400" />,
          color: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
        };
      case 'WORKER':
        return {
          label: 'Supervisor',
          icon: <HardHat size={14} className="text-amber-400" />,
          color: 'bg-amber-950/70 border-amber-500/40 text-amber-300'
        };
      case 'OWNER':
        return {
          label: 'Owner Executive',
          icon: <Crown size={14} className="text-purple-400" />,
          color: 'bg-purple-950/70 border-purple-500/40 text-purple-300'
        };
      default:
        return {
          label: role || 'Guest',
          icon: <User size={14} className="text-blue-400" />,
          color: 'bg-blue-950/70 border-blue-500/40 text-blue-300'
        };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-40 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3 shadow-md">
      <div className="flex items-center justify-between">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2.5" onClick={() => navigate('/mobile')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20 tracking-tighter cursor-pointer">
            SC
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                SANCHALAN
              </span>
              <span className="text-[9px] px-1.5 py-0.2 font-bold tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded uppercase">
                Mobile
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">
              {user ? user.name : 'Project Execution'}
            </p>
          </div>
        </div>

        {/* Right: Status & Role Switcher */}
        <div className="flex items-center gap-2">
          
          {/* Online/Offline & Sync Badge */}
          <button 
            onClick={triggerSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
              !isOnline 
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-400 animate-pulse' 
                : outboxCount > 0 
                  ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-300' 
                  : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {!isOnline ? (
              <>
                <WifiOff size={12} className="text-amber-400" />
                <span>OFFLINE</span>
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw size={12} className="animate-spin text-indigo-400" />
                <span>SYNCING</span>
              </>
            ) : outboxCount > 0 ? (
              <>
                <RefreshCw size={12} className="text-indigo-400" />
                <span>{outboxCount} PENDING</span>
              </>
            ) : (
              <>
                <Wifi size={12} className="text-emerald-400" />
                <span>ONLINE</span>
              </>
            )}
          </button>

          {/* Role Badge with Dropdown Switcher */}
          <div className="relative">
            <button 
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-sm ${badge.color}`}
            >
              {badge.icon}
              <span className="max-w-[80px] truncate">{badge.label}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${roleMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Quick Switch Dropdown */}
            {roleMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/40" 
                  onClick={() => setRoleMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                    Switch Active Role
                  </div>
                  
                  <button
                    onClick={() => { quickSwitchRole('ADMIN'); setRoleMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left font-medium transition-colors ${
                      user?.role === 'ADMIN' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                    <div>
                      <div>Site Engineer</div>
                      <div className="text-[10px] text-slate-400">Verify evidence & field routes</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { quickSwitchRole('WORKER'); setRoleMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left font-medium transition-colors ${
                      user?.role === 'WORKER' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <HardHat size={16} className="text-amber-400 shrink-0" />
                    <div>
                      <div>Field Supervisor</div>
                      <div className="text-[10px] text-slate-400">Submit progress & live walk</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { quickSwitchRole('OWNER'); setRoleMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left font-medium transition-colors ${
                      user?.role === 'OWNER' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <Crown size={16} className="text-purple-400 shrink-0" />
                    <div>
                      <div>Executive Owner</div>
                      <div className="text-[10px] text-slate-400">Portfolio & risk intelligence</div>
                    </div>
                  </button>

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    onClick={() => { logout(); setRoleMenuOpen(false); navigate('/mobile/login'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 font-bold text-left"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}

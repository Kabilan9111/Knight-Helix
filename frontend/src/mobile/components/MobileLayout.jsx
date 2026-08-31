import React from 'react';
import { Outlet } from 'react-router-dom';
import MobileHeader from './MobileHeader';
import MobileNavBar from './MobileNavBar';
import { useMobileAuth } from '../context/MobileAuthContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function MobileLayout() {
  const { syncToast } = useMobileAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-blue-600 selection:text-white pb-20">
      
      {/* Top Header */}
      <MobileHeader />

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className={`fixed top-14 left-4 right-4 z-50 p-3 rounded-xl border shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-4 duration-200 ${
          syncToast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 backdrop-blur' :
          syncToast.type === 'warning' ? 'bg-amber-950/90 border-amber-500/50 text-amber-200 backdrop-blur' :
          syncToast.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-200 backdrop-blur' :
          'bg-indigo-950/90 border-indigo-500/50 text-indigo-200 backdrop-blur'
        }`}>
          {syncToast.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> :
           syncToast.type === 'warning' ? <AlertTriangle size={16} className="text-amber-400 shrink-0" /> :
           syncToast.type === 'error' ? <AlertTriangle size={16} className="text-red-400 shrink-0" /> :
           <Info size={16} className="text-indigo-400 shrink-0" />}
          <span className="flex-1">{syncToast.message}</span>
        </div>
      )}

      {/* Main Screen Outlet */}
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <MobileNavBar />

    </div>
  );
}

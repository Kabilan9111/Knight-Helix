import React, { useState, useEffect } from 'react';
import { useMobileAuth } from '../context/MobileAuthContext';
import { useSocket } from '../../context/SocketContext';
import { 
  Activity, AlertTriangle, CheckCircle2, Clock, Camera, 
  ArrowRight, ShieldCheck, TrendingDown, TrendingUp, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function MobilePlanReality() {
  const { token, isOnline } = useMobileAuth();
  const navigate = useNavigate();
  const socket = useSocket();

  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlanReality = async () => {
    try {
      if (!token) return;
      const res = await fetch(`${API_URL}/api/admin/intelligence/projects/PROJ-001/risk-delay-ripple`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Compute plan vs reality variance for each activity
        const calculated = (data.activities || []).map(act => {
          // Deterministic planned progress based on elapsed time vs total time
          const start = new Date(act.parsedStartDate || act.startDate || '2026-08-20');
          const end = new Date(act.parsedEndDate || act.endDate || '2026-08-30');
          const now = new Date();
          const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
          const elapsedDays = Math.max(0, Math.round((now - start) / (1000 * 60 * 60 * 24)));
          const plannedProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
          const actualProgress = act.progress || 0;
          const variance = actualProgress - plannedProgress;

          return {
            ...act,
            plannedProgress,
            actualProgress,
            variance,
            hasConflict: Math.abs(variance) > 15 || act.currentDelay > 0
          };
        });
        setConflicts(calculated);
      }
    } catch (e) {
      console.warn('Plan reality error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanReality();
    if (socket) {
      socket.on('task_updated', fetchPlanReality);
      socket.on('evidence_verified', fetchPlanReality);
      return () => {
        socket.off('task_updated', fetchPlanReality);
        socket.off('evidence_verified', fetchPlanReality);
      };
    }
  }, [token]);

  const activeConflicts = conflicts.filter(c => c.hasConflict);

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md space-y-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-400">
          <Activity size={16} />
          <span>Plan vs Reality Intelligence</span>
        </div>
        <h2 className="text-base font-black text-white leading-tight">
          Field Execution vs Scheduled Baseline
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Compares planned progress curves against actual multi-modal verified field progress to detect variances before delay ripples occur.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-center">
          <div className="bg-slate-950 p-2 rounded-xl">
            <div className="text-[9px] uppercase font-bold text-slate-400">Total Monitored</div>
            <div className="text-sm font-black text-white mt-0.5">{conflicts.length} Activities</div>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl">
            <div className="text-[9px] uppercase font-bold text-slate-400">Deviations Flagged</div>
            <div className={`text-sm font-black mt-0.5 ${activeConflicts.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {activeConflicts.length} Flagged
            </div>
          </div>
        </div>
      </div>

      {/* Conflict Cards */}
      <div className="space-y-3">
        {conflicts.map(item => {
          const isBehind = item.variance < 0;
          const isAhead = item.variance > 0;

          return (
            <div 
              key={item.activityId}
              className={`bg-slate-900 border rounded-2xl p-4 shadow-sm space-y-3 transition-all ${
                item.hasConflict 
                  ? 'border-amber-500/50 bg-amber-950/10' 
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                  {item.activityId.substring(0, 10)}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1 ${
                  isBehind ? 'bg-red-950 text-red-300 border border-red-500/40' :
                  isAhead ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {isBehind ? <TrendingDown size={12} /> : isAhead ? <TrendingUp size={12} /> : null}
                  {item.variance > 0 ? `+${item.variance}% Ahead` : item.variance < 0 ? `${item.variance}% Behind` : 'On Schedule'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black text-white leading-tight mb-0.5">
                  {item.name}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-1">{item.description}</p>
              </div>

              {/* Comparative Dual Progress Bars */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80 text-xs">
                
                {/* Planned Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>SCHEDULED PLAN</span>
                    <span>{item.plannedProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-400 rounded-full" 
                      style={{ width: `${item.plannedProgress}%` }}
                    />
                  </div>
                </div>

                {/* Actual Verified Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-300">
                    <span className="text-blue-400">ACTUAL VERIFIED EXECUTION</span>
                    <span className="text-blue-400 font-black">{item.actualProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isBehind ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${item.actualProgress}%` }}
                    />
                  </div>
                </div>

              </div>

              {/* Action shortcuts */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <button
                  onClick={() => navigate(`/mobile/evidence?taskId=${item.taskId}&activityId=${item.activityId}`)}
                  className="text-blue-400 font-bold flex items-center gap-1 hover:underline text-[11px]"
                >
                  <Camera size={12} /> Submit Field Evidence
                </button>
                <button
                  onClick={() => navigate(`/mobile/field-walk?taskId=${item.taskId}&activityId=${item.activityId}`)}
                  className="text-amber-400 font-bold flex items-center gap-1 hover:underline text-[11px]"
                >
                  <Activity size={12} /> Spatial Trace
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

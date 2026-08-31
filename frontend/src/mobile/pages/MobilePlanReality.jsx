import React, { useState, useEffect } from 'react';
import { useMobileAuth } from '../context/MobileAuthContext';
import { useSocket } from '../../context/SocketContext';
import { 
  Activity, AlertTriangle, CheckCircle2, Clock, Camera, 
  ArrowRight, ShieldCheck, TrendingDown, TrendingUp, Layers, RefreshCw,
  GitPullRequest, Zap, Play, ChevronRight, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { API_URL } from '../config';

export default function MobilePlanReality() {
  const { token, isOnline } = useMobileAuth();
  const navigate = useNavigate();
  const socket = useSocket();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('PROJ-001');
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delay Ripple / What-If Simulation State
  const [simulateActivityId, setSimulateActivityId] = useState('');
  const [simulateDelayDays, setSimulateDelayDays] = useState(5);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState('PLAN_VS_REALITY'); // PLAN_VS_REALITY or DELAY_RIPPLE

  const fetchProjects = async () => {
    try {
      if (!token) return;
      const res = await fetch(`${API_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const projs = await res.json();
        setProjects(projs);
        if (projs.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projs[0].projectId);
        }
      }
    } catch (e) {
      console.warn('Projects fetch error:', e);
    }
  };

  const fetchPlanReality = async (projId) => {
    if (!token || !projId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/intelligence/projects/${projId}/risk-delay-ripple`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const calculated = (data.activities || []).map(act => {
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
        if (calculated.length > 0 && !simulateActivityId) {
          setSimulateActivityId(calculated[0].activityId);
        }
      }
    } catch (e) {
      console.warn('Plan reality error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchPlanReality(selectedProjectId);
      setSimulationResult(null);
    }
  }, [selectedProjectId, token]);

  useEffect(() => {
    if (!socket || !selectedProjectId) return;
    const handleUpdate = () => fetchPlanReality(selectedProjectId);
    socket.on('task_updated', handleUpdate);
    socket.on('evidence_verified', handleUpdate);
    return () => {
      socket.off('task_updated', handleUpdate);
      socket.off('evidence_verified', handleUpdate);
    };
  }, [socket, selectedProjectId]);

  // Run What-If Delay Ripple Simulation using Real CPM / DAG Risk Engine
  const handleRunSimulation = async () => {
    if (!selectedProjectId || !simulateActivityId) return;
    setSimulating(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/intelligence/projects/${selectedProjectId}/risk-delay-ripple?simulateActivityId=${simulateActivityId}&simulateDelayDays=${simulateDelayDays}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data);
      }
    } catch (err) {
      console.warn('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const activeConflicts = conflicts.filter(c => c.hasConflict);

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-200">
      
      {/* Top View Selector: Plan vs Reality OR What-If Simulation */}
      <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('PLAN_VS_REALITY')}
          className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'PLAN_VS_REALITY' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity size={14} /> Plan vs Reality
        </button>
        <button
          onClick={() => setActiveTab('DELAY_RIPPLE')}
          className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'DELAY_RIPPLE' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap size={14} /> Delay Ripple Simulation
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-400">
            <Layers size={16} />
            <span>Real DAG Project Intelligence</span>
          </div>
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-bold text-white px-2.5 py-1 rounded-xl outline-none focus:border-purple-500"
            >
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        <h2 className="text-base font-black text-white leading-tight">
          {activeTab === 'PLAN_VS_REALITY' ? 'Field Execution vs Scheduled Baseline' : 'Topological What-If Delay Ripple'}
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {activeTab === 'PLAN_VS_REALITY' 
            ? 'Compares scheduled plan curves against actual verified field progress to detect variances before delay ripples cascade.'
            : 'Simulates hypothetical upstream milestone delays to project cascading downstream impacts across the Critical Path.'}
        </p>

        {activeTab === 'PLAN_VS_REALITY' && (
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
        )}
      </div>

      {/* VIEW 1: PLAN VS REALITY LIST */}
      {activeTab === 'PLAN_VS_REALITY' && (
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
                    {item.activityId.substring(0, 14)}
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
                      <span className="text-blue-400 font-bold">ACTUAL VERIFIED EXECUTION</span>
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
                    <Camera size={12} /> Submit Field Proof
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
      )}

      {/* VIEW 2: WHAT-IF DELAY RIPPLE SIMULATOR */}
      {activeTab === 'DELAY_RIPPLE' && (
        <div className="space-y-4">
          
          {/* Simulator Controls */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
              <Zap size={12} /> Hypothetical What-If Parameter
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Select Milestone / Activity to Delay
              </label>
              <select
                value={simulateActivityId}
                onChange={(e) => setSimulateActivityId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white font-semibold p-2.5 rounded-xl text-xs outline-none focus:border-amber-500"
              >
                {conflicts.map(a => (
                  <option key={a.activityId} value={a.activityId}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Hypothetical Schedule Delay
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[2, 5, 10, 14].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setSimulateDelayDays(days)}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      simulateDelayDays === days 
                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    +{days} Days
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={simulating}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-[0.99] text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Play fill="currentColor" size={14} /> {simulating ? 'Calculating DAG Ripple...' : 'Simulate Delay Ripple'}
            </button>
          </div>

          {/* Simulation Output Card */}
          {simulationResult && (
            <div className="bg-slate-900 border border-amber-500/50 p-4 rounded-2xl shadow-xl space-y-3 animate-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                  DAG Topological Ripple Impact
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  +{simulateDelayDays}d on {simulateActivityId.substring(0, 10)}
                </span>
              </div>

              {/* Impact Metrics */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[9px] uppercase font-bold text-slate-400">Critical Path Delay</div>
                  <div className="text-base font-black text-red-400 mt-0.5">
                    +{simulationResult.criticalPathDelay || simulateDelayDays} Days
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[9px] uppercase font-bold text-slate-400">Affected Activities</div>
                  <div className="text-base font-black text-amber-400 mt-0.5">
                    {simulationResult.affectedActivitiesCount || 2} Downstream
                  </div>
                </div>
              </div>

              {/* Affected Activities Downstream List */}
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  Downstream Cascading Effects:
                </div>
                {(simulationResult.activities || []).filter(a => a.isCriticalRipple || a.currentDelay > 0).map(act => (
                  <div key={act.activityId} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                    <span className="font-bold text-white">{act.name}</span>
                    <span className="text-red-400 font-black font-mono">Delayed by +{act.currentDelay || simulateDelayDays}d</span>
                  </div>
                ))}
              </div>

              {/* Non-destructive Notice */}
              <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-xl text-[10px] text-blue-300 flex items-center gap-1.5">
                <Info size={14} className="shrink-0" />
                <span>Simulation Only. The real project schedule in the database remains unchanged.</span>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

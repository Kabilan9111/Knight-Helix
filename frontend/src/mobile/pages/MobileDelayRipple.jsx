import React, { useState, useEffect } from 'react';
import { useMobileAuth } from '../context/MobileAuthContext';
import { useSocket } from '../../context/SocketContext';
import { 
  AlertTriangle, Clock, Activity, ArrowRight, GitMerge, 
  RefreshCw, CheckCircle2, ChevronDown, ChevronUp, Sliders, ShieldAlert, Layers
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function MobileDelayRipple() {
  const { token, isOnline } = useMobileAuth();
  const socket = useSocket();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('PROJ-001');
  const [intelligenceData, setIntelligenceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Simulation Controls
  const [simulateActivityId, setSimulateActivityId] = useState('');
  const [simulateDelayDays, setSimulateDelayDays] = useState(0);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

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

  const fetchIntelligence = async (projId, simActId = null, simDays = 0) => {
    if (!projId || !token) return;
    setLoading(true);
    setError('');
    try {
      let url = `${API_URL}/api/admin/intelligence/projects/${projId}/risk-delay-ripple`;
      if (simActId && simDays > 0) {
        url += `?simulateActivityId=${simActId}&simulateDelayDays=${simDays}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to compute risk & delay ripple');
      const data = await res.json();
      setIntelligenceData(data);
      if (!simulateActivityId && data.activities?.length > 0) {
        setSimulateActivityId(data.activities[0].activityId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchIntelligence(selectedProjectId, simulateActivityId, simulateDelayDays);
    }
  }, [selectedProjectId, simulateActivityId, simulateDelayDays, token]);

  // Real-time updates
  useEffect(() => {
    if (!socket || !selectedProjectId) return;
    const handleUpdate = () => {
      fetchIntelligence(selectedProjectId, simulateActivityId, simulateDelayDays);
    };
    socket.on('task_updated', handleUpdate);
    socket.on('evidence_verified', handleUpdate);
    return () => {
      socket.off('task_updated', handleUpdate);
      socket.off('evidence_verified', handleUpdate);
    };
  }, [socket, selectedProjectId, simulateActivityId, simulateDelayDays]);

  const toggleNodeExpand = (id) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const summary = intelligenceData?.summary || {};
  const activities = intelligenceData?.activities || [];
  const criticalActivities = activities.filter(a => a.riskLevel === 'CRITICAL' || a.isCriticalRipple);
  const highRiskActivities = activities.filter(a => a.riskLevel === 'HIGH' && !a.isCriticalRipple);

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-200">
      
      {/* Header & Project Selector */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-400">
            <GitMerge size={16} />
            <span>DAG Delay Ripple Engine</span>
          </div>
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-bold text-white px-2.5 py-1 rounded-xl outline-none"
            >
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Project Risk Summary Card */}
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[9px] uppercase font-bold text-slate-400">Overall Risk</div>
            <div className={`text-sm font-black mt-0.5 ${
              summary.overallRisk === 'CRITICAL' ? 'text-red-400' :
              summary.overallRisk === 'HIGH' ? 'text-orange-400' :
              summary.overallRisk === 'MEDIUM' ? 'text-amber-400' :
              'text-emerald-400'
            }`}>
              {summary.overallRisk || 'LOW'}
            </div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[9px] uppercase font-bold text-slate-400">Delayed Nodes</div>
            <div className="text-sm font-black text-amber-400 mt-0.5">
              {summary.delayed || 0}
            </div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[9px] uppercase font-bold text-slate-400">Critical Ripples</div>
            <div className="text-sm font-black text-red-400 mt-0.5">
              {criticalActivities.length}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive What-If Simulation Controls */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 p-4 rounded-2xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Sliders size={14} /> What-If Delay Simulator
          </h3>
          {simulateDelayDays > 0 && (
            <button
              onClick={() => { setSimulateDelayDays(0); }}
              className="text-[10px] font-bold text-indigo-300 hover:text-white underline"
            >
              Reset Simulation
            </button>
          )}
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            Select Activity to Delay:
          </label>
          <select
            value={simulateActivityId}
            onChange={(e) => setSimulateActivityId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-bold p-2.5 rounded-xl outline-none"
          >
            {activities.map(a => (
              <option key={a.activityId} value={a.activityId}>
                {a.name} ({a.status})
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-slate-300">Simulate Delay Impact:</span>
            <span className="text-amber-400">+{simulateDelayDays} Days</span>
          </div>
          <input 
            type="range"
            min="0"
            max="14"
            step="1"
            value={simulateDelayDays}
            onChange={(e) => setSimulateDelayDays(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
            <span>0d (Real)</span>
            <span>+7d</span>
            <span>+14d (Critical)</span>
          </div>
        </div>

        {simulateDelayDays > 0 && (
          <div className="p-2.5 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-xs text-indigo-200 leading-relaxed font-medium">
            ⚡ Simulating <strong>+{simulateDelayDays} day delay</strong> on selected activity. Topological sort has propagated downstream ripple delays across dependent successors below.
          </div>
        )}
      </div>

      {/* Downstream Impact Dependency Chains */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
          <span>Activity Dependency Chain ({activities.length})</span>
          <span className="text-[10px] text-blue-400 font-bold">Topologically Ordered</span>
        </h3>

        {activities.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-xs">
            No activity dependency records found for this project.
          </div>
        ) : (
          activities.map((act) => {
            const isExpanded = expandedNodes.has(act.activityId);
            const isCritical = act.riskLevel === 'CRITICAL' || act.isCriticalRipple;
            const isHigh = act.riskLevel === 'HIGH';

            return (
              <div 
                key={act.activityId}
                className={`bg-slate-900 border rounded-2xl p-4 shadow-sm transition-all space-y-3 ${
                  isCritical ? 'border-red-500/60 bg-red-950/20' :
                  isHigh ? 'border-orange-500/50' :
                  act.status === 'COMPLETED' ? 'border-emerald-500/30' :
                  'border-slate-800'
                }`}
              >
                <div 
                  onClick={() => toggleNodeExpand(act.activityId)}
                  className="flex items-start justify-between cursor-pointer"
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">
                        {act.activityId.substring(0, 10)}
                      </span>
                      {act.currentDelay > 0 && (
                        <span className="text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded">
                          +{act.currentDelay}d Ripple Delay
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded uppercase ${
                        isCritical ? 'bg-red-950 text-red-300' :
                        isHigh ? 'bg-orange-950 text-orange-300' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {act.riskLevel}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white leading-tight">
                      {act.name}
                    </h4>
                  </div>

                  <button className="text-slate-400 p-1">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-800/80">
                  <div className="bg-slate-950/60 p-2 rounded-xl">
                    <div className="text-[9px] uppercase text-slate-400 font-bold">Planned End</div>
                    <div className="font-bold text-slate-200 mt-0.5">{act.parsedEndDate || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl">
                    <div className="text-[9px] uppercase text-slate-400 font-bold">Projected End</div>
                    <div className={`font-bold mt-0.5 ${act.currentDelay > 0 ? 'text-red-400 font-black' : 'text-slate-200'}`}>
                      {act.projectedEndDate || act.parsedEndDate || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl">
                    <div className="text-[9px] uppercase text-slate-400 font-bold">Impacted Nodes</div>
                    <div className="font-black text-amber-400 mt-0.5">{act.downstreamImpactCount || 0}</div>
                  </div>
                </div>

                {/* Expanded Risk Factors */}
                {isExpanded && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="font-bold text-slate-300 uppercase text-[10px]">Deterministic Risk Factors:</div>
                    <div className="space-y-1">
                      {act.riskFactors?.map((f, i) => (
                        <div key={i} className="flex justify-between items-center py-1 border-b border-slate-800/50 text-[11px]">
                          <span className="text-slate-400">{f.factor}:</span>
                          <span className="font-bold text-slate-200">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AlertTriangle, Clock, Activity, ArrowRight, RefreshCw, GitMerge, Filter, 
  CheckCircle, XCircle, X, Users, Briefcase
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import {
  ReactFlow, Controls, Background, applyNodeChanges, applyEdgeChanges, MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CustomNode = ({ data }) => {
  let borderColor = 'border-blue-500/50';
  let bgColor = 'bg-slate-900';
  
  if (data.status === 'COMPLETED' || data.status === 'VERIFIED') {
    borderColor = 'border-emerald-500/50';
  } else if (data.isCriticalRipple || data.riskLevel === 'CRITICAL') {
    borderColor = 'border-red-500';
    bgColor = 'bg-red-950/40';
  } else if (data.riskLevel === 'HIGH') {
    borderColor = 'border-orange-500';
  } else if (data.riskLevel === 'MEDIUM') {
    borderColor = 'border-amber-500/70';
  }

  // De-emphasize if not related to selected worker (handled in style, but we can do opacity here if passed)
  const opacity = data.isFilteredOut ? 'opacity-30' : 'opacity-100';

  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${borderColor} ${bgColor} shadow-lg min-w-[200px] transition-opacity duration-300 ${opacity}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-400">{data.activityId.substring(0, 8)}...</span>
        {data.currentDelay > 0 && (
          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded">
            +{data.currentDelay}d
          </span>
        )}
      </div>
      <div className="text-sm font-bold text-white mb-1">{data.name}</div>
      <div className="flex justify-between items-end mt-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400">STATUS</span>
          <span className="text-[11px] text-slate-200">{data.status}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-400">PROGRESS</span>
          <span className="text-[11px] font-bold text-white">{data.progress}%</span>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

export default function RiskDelayRipple() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [intelligenceData, setIntelligenceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const socket = useSocket();
  
  // Selection
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // Flow states
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  // Simulation
  const [simulateDelayDays, setSimulateDelayDays] = useState(0);
  const [simulateActivityId, setSimulateActivityId] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('sanchalan_token');
      const res = await fetch(`${API_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIntelligence = async (projectId, simActivityId = null, simDays = 0) => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('sanchalan_token');
      let url = `${API_URL}/api/admin/intelligence/projects/${projectId}/risk-delay-ripple`;
      if (simActivityId && simDays > 0) {
        url += `?simulateActivityId=${simActivityId}&simulateDelayDays=${simDays}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch intelligence data');
      const data = await res.json();
      setIntelligenceData(data);
      
      if (selectedActivity) {
        const updated = data.activities.find(a => a.activityId === selectedActivity.activityId);
        if (updated) setSelectedActivity(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      // Clear worker selection when project changes
      setSelectedWorkerId('');
      setSelectedActivity(null);
      fetchIntelligence(selectedProjectId, simulateActivityId, simulateDelayDays);
    } else {
      setIntelligenceData(null);
    }
  }, [selectedProjectId, simulateActivityId, simulateDelayDays]);

  // Real-time updates
  useEffect(() => {
    if (!socket || !selectedProjectId) return;
    const handleUpdate = () => {
      fetchIntelligence(selectedProjectId, simulateActivityId, simulateDelayDays);
    };
    socket.on('task_updated', handleUpdate);
    socket.on('evidence_submitted', handleUpdate);
    socket.on('verification_completed', handleUpdate);
    return () => {
      socket.off('task_updated', handleUpdate);
      socket.off('evidence_submitted', handleUpdate);
      socket.off('verification_completed', handleUpdate);
    };
  }, [socket, selectedProjectId, simulateActivityId, simulateDelayDays]);

  useEffect(() => {
    if (intelligenceData) {
      buildGraph(intelligenceData, selectedWorkerId);
    }
  }, [intelligenceData, selectedWorkerId]);

  const buildGraph = (data, workerIdFilter) => {
    if (!data.activities || data.activities.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const newNodes = [];
    const newEdges = [];

    // Filter relevant activities if a worker is selected
    // An activity is relevant if assigned to the worker, OR if it's downstream of a worker's activity, 
    // OR just dim out the unrelated ones. We'll dim them out.
    const workerActivityIds = new Set(data.activities.filter(a => a.assignedWorkerId === workerIdFilter).map(a => a.activityId));
    
    // Simple topological sort for layout
    const depths = new Map();
    const inDegree = new Map();
    data.activities.forEach(a => inDegree.set(a.activityId, 0));
    data.dependencies.forEach(d => {
      if (inDegree.has(d.successorActivityId)) {
        inDegree.set(d.successorActivityId, inDegree.get(d.successorActivityId) + 1);
      }
    });

    const queue = [];
    data.activities.forEach(a => {
      if (inDegree.get(a.activityId) === 0) {
        queue.push(a.activityId);
        depths.set(a.activityId, 0);
      }
    });

    while (queue.length > 0) {
      const curr = queue.shift();
      const currDepth = depths.get(curr);
      data.dependencies.filter(d => d.predecessorActivityId === curr).forEach(d => {
        const succ = d.successorActivityId;
        depths.set(succ, Math.max(depths.get(succ) || 0, currDepth + 1));
        inDegree.set(succ, inDegree.get(succ) - 1);
        if (inDegree.get(succ) === 0) queue.push(succ);
      });
    }

    const depthCounts = {};
    data.activities.forEach(a => {
      const d = depths.get(a.activityId) || 0;
      if (!depthCounts[d]) depthCounts[d] = 0;
      
      const isFilteredOut = workerIdFilter ? !workerActivityIds.has(a.activityId) : false;

      newNodes.push({
        id: a.activityId,
        type: 'custom',
        position: { x: d * 350 + 50, y: depthCounts[d] * 150 + 50 },
        data: { ...a, isFilteredOut }
      });
      depthCounts[d]++;
    });

    data.dependencies.forEach(d => {
      newEdges.push({
        id: `e-${d.predecessorActivityId}-${d.successorActivityId}`,
        source: d.predecessorActivityId,
        target: d.successorActivityId,
        animated: true,
        style: { stroke: '#475569', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onNodeClick = (e, node) => setSelectedActivity(node.data);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-base)] overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-1)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <AlertTriangle className="text-[var(--accent-primary)]" />
              Risk & Delay Ripple Engine
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Predictive delay analysis powered by real project execution data.
            </p>
          </div>
          <div className="w-72">
            <label className="text-xs font-bold text-[var(--text-tertiary)] mb-1 block uppercase">Target Project</label>
            <select 
              className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">Select a project to view execution intelligence.</option>
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {intelligenceData?.summary && (
          <div className="grid grid-cols-6 gap-4 mb-2">
            <div className="bg-[var(--bg-base)] rounded-xl p-3 border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-tertiary)] font-bold mb-1 uppercase">Total Tasks</div>
              <div className="text-xl font-bold text-white">{intelligenceData.summary.totalTasks}</div>
            </div>
            <div className="bg-[var(--bg-base)] rounded-xl p-3 border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-tertiary)] font-bold mb-1 uppercase">In Progress</div>
              <div className="text-xl font-bold text-blue-400">{intelligenceData.summary.inProgress}</div>
            </div>
            <div className="bg-[var(--bg-base)] rounded-xl p-3 border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-tertiary)] font-bold mb-1 uppercase">Verification</div>
              <div className="text-xl font-bold text-amber-400">{intelligenceData.summary.verificationPending}</div>
            </div>
            <div className="bg-[var(--bg-base)] rounded-xl p-3 border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-tertiary)] font-bold mb-1 uppercase">Completed</div>
              <div className="text-xl font-bold text-emerald-400">{intelligenceData.summary.completed}</div>
            </div>
            <div className="bg-[var(--bg-base)] rounded-xl p-3 border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-tertiary)] font-bold mb-1 uppercase">Delayed</div>
              <div className="text-xl font-bold text-red-400">{intelligenceData.summary.delayed}</div>
            </div>
            <div className="bg-[var(--bg-base)] rounded-xl p-3 border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-tertiary)] font-bold mb-1 uppercase">Progress</div>
              <div className="text-xl font-bold text-white">{intelligenceData.summary.overallProgress}%</div>
            </div>
          </div>
        )}
      </div>

      {!selectedProjectId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] bg-[var(--bg-base)]">
          <Filter size={48} className="mb-4 opacity-50" />
          <p>Select a project to view execution intelligence.</p>
        </div>
      ) : loading && !intelligenceData ? (
        <div className="flex-1 flex items-center justify-center bg-[var(--bg-base)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-red-500 bg-[var(--bg-base)]">
          <p>{error}</p>
          <button onClick={() => fetchIntelligence(selectedProjectId)} className="mt-4 px-4 py-2 bg-red-500/20 rounded hover:bg-red-500/30 font-bold">Retry</button>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Workforce & Tasks */}
          <div className="w-[450px] flex-none border-r border-[var(--border-subtle)] bg-[var(--bg-base)] flex flex-col overflow-hidden">
            {/* Workforce Section */}
            <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-1)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <Users size={16} className="text-[var(--accent-primary)]" /> Project Workforce
                </h2>
                <select 
                  className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-white"
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                >
                  <option value="">ALL WORKERS</option>
                  {intelligenceData?.workers?.map(w => (
                    <option key={w.workerId} value={w.workerId}>{w.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                {intelligenceData?.workers?.length === 0 ? (
                  <p className="text-sm text-[var(--text-tertiary)] italic">No workers are currently assigned to this project's tasks.</p>
                ) : (
                  intelligenceData?.workers?.map(w => (
                    <div 
                      key={w.workerId} 
                      onClick={() => setSelectedWorkerId(w.workerId)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedWorkerId === w.workerId ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-base)] hover:border-slate-600'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-white text-sm">{w.name}</div>
                          <div className="text-[10px] text-[var(--text-tertiary)]">{w.skills || 'Field Worker'}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          w.metrics.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                          w.metrics.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                          w.metrics.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {w.metrics.riskLevel} RISK
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-[var(--text-secondary)]"><strong className="text-white">{w.metrics.assignedCount}</strong> Tasks</span>
                        <span className="text-[var(--text-secondary)]"><strong className="text-blue-400">{w.metrics.inProgressCount}</strong> Active</span>
                        <span className="text-[var(--text-secondary)]"><strong className="text-emerald-400">{w.metrics.completedCount}</strong> Done</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Worker Tasks */}
            <div className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Briefcase size={16} className="text-[var(--accent-primary)]" /> 
                {selectedWorkerId ? `${intelligenceData?.workers.find(w => w.workerId === selectedWorkerId)?.name}'s Tasks` : 'All Project Tasks'}
              </h2>
              
              <div className="space-y-3">
                {intelligenceData?.tasks?.filter(t => !selectedWorkerId || t.assignedWorkerId === selectedWorkerId).length === 0 ? (
                  <p className="text-sm text-[var(--text-tertiary)] italic">No tasks are currently assigned to this worker in this project.</p>
                ) : (
                  intelligenceData?.tasks?.filter(t => !selectedWorkerId || t.assignedWorkerId === selectedWorkerId).map(t => (
                    <Link key={t.taskId} to={`/admin/tasks/${t.taskId}`} className="block bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] rounded-lg p-3 hover:border-slate-500 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-sm text-white group-hover:text-[var(--accent-primary)] transition-colors">{t.title}</div>
                        <span className="text-[10px] px-2 py-0.5 bg-[var(--bg-surface-2)] text-[var(--text-secondary)] rounded font-bold">{t.derivedStatus}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-[10px] text-[var(--text-tertiary)]">
                          Start: <span className="text-slate-300">{t.startDate || 'N/A'}</span>
                        </div>
                        <div className="text-[11px] font-bold text-emerald-400">{t.progress}%</div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Graph & Risk Analysis */}
          <div className="flex-1 flex flex-col relative bg-[var(--bg-surface-2)]">
            <div className="absolute top-4 left-4 right-4 z-10 flex gap-4 pointer-events-none">
              <div className="bg-[var(--bg-surface-1)]/90 backdrop-blur border border-[var(--border-subtle)] rounded-lg p-3 pointer-events-auto shadow-lg flex gap-6">
                <div>
                  <div className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase mb-1">Delayed Activities</div>
                  <div className="text-lg font-bold text-red-400">{intelligenceData?.summary.delayed}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase mb-1">Critical Paths</div>
                  <div className="text-lg font-bold text-orange-400">{intelligenceData?.summary.overallRisk === 'CRITICAL' ? 'YES' : 'NO'}</div>
                </div>
              </div>
            </div>

            {intelligenceData?.activities?.length === 0 ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-secondary)]">
                 <p>No execution activities found for this project.</p>
               </div>
            ) : intelligenceData?.dependencies?.length === 0 ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-secondary)]">
                 <p>No dependency relationships have been defined for this project.</p>
               </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                className="bg-[var(--bg-base)]"
              >
                <Background color="#1e293b" gap={16} />
                <Controls className="bg-slate-800 border-slate-700 fill-slate-300" />
              </ReactFlow>
            )}

            {simulateActivityId && (
              <div className="absolute top-4 right-4 bg-orange-500/20 border border-orange-500/50 text-orange-400 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg backdrop-blur-sm z-10">
                <AlertTriangle size={16} /> SIMULATION — NOT APPLIED TO PRODUCTION
                <button onClick={() => { setSimulateActivityId(''); setSimulateDelayDays(0); }} className="ml-4 hover:text-white"><X size={16}/></button>
              </div>
            )}
          </div>

          {/* Activity Detail Flyout */}
          {selectedActivity && (
            <div className="w-80 flex-none bg-[var(--bg-surface-1)] border-l border-[var(--border-subtle)] overflow-y-auto custom-scrollbar shadow-2xl flex flex-col z-20">
              <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between sticky top-0 bg-[var(--bg-surface-1)] z-10">
                <h2 className="font-bold text-white text-sm">Activity Intelligence</h2>
                <button onClick={() => setSelectedActivity(null)} className="text-[var(--text-tertiary)] hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-4">
                <div className="text-[10px] text-[var(--text-tertiary)] font-bold mb-1">{selectedActivity.activityId}</div>
                <div className="text-base font-bold text-white mb-2">{selectedActivity.name}</div>
                
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Risk Factors</h3>
                  <div className="space-y-1.5">
                    {selectedActivity.riskFactors.map((f, i) => (
                      <div key={i} className="flex justify-between items-center bg-[var(--bg-base)] px-2 py-1.5 rounded border border-[var(--border-subtle)]">
                        <span className="text-[10px] text-[var(--text-tertiary)]">{f.factor}</span>
                        <span className={`text-[10px] font-bold ${
                          f.value.includes('Late') || f.value.includes('YES') || f.value.includes('-') || f.value.includes('Pushed') 
                            ? 'text-red-400' : f.value.includes('+') ? 'text-orange-400' : 'text-slate-200'
                        }`}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedActivity.status !== 'COMPLETED' && selectedActivity.status !== 'VERIFIED' && (
                  <div className="mt-6 border-t border-[var(--border-subtle)] pt-4">
                    <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Clock size={12} /> Simulate Delay
                    </h3>
                    <div className="flex gap-2">
                      <input 
                        type="number" min="0" value={simulateDelayDays}
                        onChange={(e) => setSimulateDelayDays(parseInt(e.target.value) || 0)}
                        className="w-16 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded px-2 text-white text-xs"
                      />
                      <button 
                        onClick={() => setSimulateActivityId(selectedActivity.activityId)}
                        className="flex-1 bg-orange-500/20 text-orange-400 border border-orange-500/50 hover:bg-orange-500/30 rounded px-2 py-1 text-xs font-bold transition-colors"
                      >Run Simulation</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

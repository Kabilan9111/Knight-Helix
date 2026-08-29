import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  BrainCircuit, Activity, Calendar, 
  Download, Play, CheckCircle2,
  ChevronRight, Info
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export default function AIExecutionVisualization() {
  const [viewState, setViewState] = useState('selection');
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [data, setData] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('Civil Team A');
  const [activeScenario, setActiveScenario] = useState('baseline');
  const [selectedTask, setSelectedTask] = useState(null);
  const [livePulse, setLivePulse] = useState(false);
  const [error, setError] = useState(null);
  const socket = useSocket();

  const loadingMessages = [
    "SANCHALAN EXECUTION INTELLIGENCE",
    "Loading execution state...",
    "Reading historical productivity...",
    "Analyzing current execution...",
    "Simulating completion scenarios...",
    "FORECAST ENGINE READY"
  ];

  const handleVisualize = async () => {
    setViewState('analyzing');
    setLoadingPhase(0);
    setError(null);
    
    // Start fetching data in background
    const fetchPromise = fetchData();

    // Run cinematic animation
    for (let i = 0; i < loadingMessages.length; i++) {
      setLoadingPhase(i);
      await new Promise(r => setTimeout(r, i === 0 ? 1500 : 800));
    }
    
    const success = await fetchPromise;
    if (success) {
      setViewState('results');
    } else {
      setViewState('error');
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('sanchalan_token');
      if (!token || token === 'null' || token === 'undefined') {
        window.location.href = '/login';
        return false;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      let formattedTeamId = 'civil-a'; // fallback
      if (selectedTeam === 'Civil Team A') formattedTeamId = 'civil-a';
      else if (selectedTeam === 'Mechanical Team B') formattedTeamId = 'mechanical-b';
      else if (selectedTeam === 'Electrical Team C') formattedTeamId = 'electrical-c';
      else if (selectedTeam === 'Piping Team D') formattedTeamId = 'piping-d';

      const response = await fetch(`${baseUrl}/api/visualization/team/${formattedTeamId}`, { headers });
      
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('sanchalan_token');
          localStorage.removeItem('sanchalan_user');
          window.location.href = '/login';
          return false;
        }
        const text = await response.text();
        throw new Error(`API failed: ${response.status} ${text.slice(0, 100)}`);
      }
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`API returned non-JSON: ${text.slice(0, 100)}`);
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
      return true;
    } catch (err) {
      console.error("Error fetching visualization data:", err);
      setError(err.message);
      return false;
    }
  };

  useEffect(() => {
    if (socket) {
      const handleTaskUpdate = (payload) => {
        if (viewState === 'results') {
          setLivePulse(true);
          setTimeout(() => setLivePulse(false), 2000);
          if (data) fetchData();
        }
      };
      
      socket.on('task_updated', handleTaskUpdate);

      return () => {
        socket.off('task_updated', handleTaskUpdate);
      };
    }
  }, [socket, data, viewState, selectedTeam]);


  if (viewState === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0f1c] text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <BrainCircuit size={64} className="text-[var(--accent-primary)] mb-6 animate-pulse" />
          <h2 className="text-2xl font-bold tracking-[0.2em] text-[var(--accent-primary-hover)] mb-8 text-center">
            {loadingMessages[0]}
          </h2>
          
          <div className="h-8 text-center text-[var(--text-secondary)]">
            <AnimatePresence mode="wait">
              {loadingPhase > 0 && (
                <motion.p
                  key={loadingPhase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="tracking-wider text-sm font-medium"
                >
                  {loadingMessages[loadingPhase]}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          
          <div className="w-64 h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: "0%" }}
              animate={{ width: `${(loadingPhase / (loadingMessages.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0f1c] text-white overflow-hidden custom-scrollbar relative">
      {/* Top Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-8 py-5 border-b border-white/10 bg-[#0d1425]/80 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-white flex items-center gap-3">
            <BrainCircuit className="text-purple-500" size={24} />
            AI EXECUTION VISUALIZATION
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-1 tracking-wide">
            Scenario-based prediction of task completion using historical productivity and live execution data.
          </p>
        </div>
        
        <div className="flex items-center gap-6 text-sm">
          {viewState === 'results' && (
            <div className="flex items-center gap-3 mr-4">
              <button 
                onClick={() => setViewState('selection')}
                className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
              >
                CHANGE TEAM
              </button>
              <button 
                onClick={handleVisualize}
                className="px-3 py-1.5 text-xs font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded transition-colors"
              >
                RE-RUN ANALYSIS
              </button>
            </div>
          )}
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Project</span>
            <span className="font-semibold text-purple-400">RIVERFRONT INFRASTRUCTURE</span>
          </div>
          
          <div className="w-px h-8 bg-white/10"></div>
          
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Data Status</span>
            <div className="flex items-center gap-2">
              <motion.div 
                animate={livePulse ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
                transition={{ duration: 0.5 }}
                className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
              />
              <span className="font-medium text-cyan-400">LIVE</span>
            </div>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition-colors ml-4">
            <Download size={14} /> Export Report
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 relative z-10">
        {/* Background glow effects */}
        <div className="fixed top-[20%] left-[10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="fixed bottom-[10%] right-[10%] w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[150px] pointer-events-none"></div>

        {viewState === 'selection' ? (
          /* Pre-visualization State */
          <div className="flex flex-col items-center justify-center h-[60vh] relative z-20">
            <div className="bg-[#121a2f] border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-600"></div>
              
              <h3 className="text-lg font-medium text-center mb-6 text-white/90">SELECT TEAM TO ANALYZE</h3>
              
              <div className="flex flex-col gap-3 mb-8">
                {['Civil Team A', 'Mechanical Team B', 'Electrical Team C', 'Piping Team D'].map(team => (
                  <button 
                    key={team}
                    onClick={() => setSelectedTeam(team)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium border text-left transition-all flex items-center justify-between ${
                      selectedTeam === team 
                        ? 'bg-purple-900/40 border-purple-500/50 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <span>{team}</span>
                    {selectedTeam === team && <CheckCircle2 size={16} className="text-purple-400" />}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={handleVisualize}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl font-bold tracking-widest text-sm shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all flex items-center justify-center gap-3"
              >
                <Play size={16} /> VISUALIZE
              </button>
            </div>
          </div>
        ) : viewState === 'error' ? (
          <div className="flex flex-col items-center justify-center h-[60vh] relative z-20">
            <div className="bg-[#121a2f] border border-red-500/20 p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
              
              <h3 className="text-lg font-medium text-center mb-6 text-red-400">EXECUTION ANALYSIS FAILED</h3>
              
              <div className="mb-8 text-sm text-gray-300 text-center">
                <p className="mb-2">Unable to retrieve prediction data from the execution engine.</p>
                <div className="bg-black/30 p-3 rounded text-xs text-red-300 overflow-hidden text-left font-mono break-all">
                  {error || "Unknown error occurred"}
                </div>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setViewState('selection')}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold tracking-widest text-xs transition-all"
                >
                  CHANGE TEAM
                </button>
                <button 
                  onClick={handleVisualize}
                  className="flex-1 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl font-bold tracking-widest text-xs transition-all"
                >
                  RETRY ANALYSIS
                </button>
              </div>
            </div>
          </div>
        ) : viewState === 'results' && data ? (
          /* Main Workspace */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-8 max-w-7xl mx-auto relative z-20"
          >
            {/* 1. Execution Summary */}
            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-4 grid grid-cols-4 gap-4">
                {[
                  { label: "TOTAL TASKS", value: data.summary.totalTasks, color: "text-white" },
                  { label: "COMPLETED", value: data.summary.completed, sub: `${Math.round(data.summary.completed/data.summary.totalTasks*100)}%`, color: "text-emerald-400" },
                  { label: "IN PROGRESS", value: data.summary.inProgress, sub: `${Math.round(data.summary.inProgress/data.summary.totalTasks*100)}%`, color: "text-amber-400" },
                  { label: "REMAINING", value: data.summary.remaining, sub: `${Math.round(data.summary.remaining/data.summary.totalTasks*100)}%`, color: "text-blue-400" },
                ].map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#121a2f]/80 border border-white/5 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-white/20 transition-colors"
                  >
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-2">{stat.label}</span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-light ${stat.color}`}>{stat.value}</span>
                      {stat.sub && <span className="text-xs text-gray-500 font-medium">{stat.sub}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Productivity Score */}
              <div className="col-span-2 bg-gradient-to-br from-[#121a2f] to-[#1a123a] border border-purple-500/20 rounded-xl p-5 backdrop-blur-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-2">TEAM PRODUCTIVITY</span>
                  <div className="flex flex-col">
                    <span className="text-4xl font-light text-white mb-1">{data.summary.teamProductivity}%</span>
                    <div className="flex gap-4 text-xs text-gray-400 mt-1">
                      <span>Historical: <span className="text-white">{data.summary.historicalProductivity}%</span></span>
                      <span>Trend: <span className="text-emerald-400">+{data.summary.currentTrend}%</span></span>
                    </div>
                  </div>
                </div>
                
                {/* Radial Chart Graphic representation */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
                    <motion.circle 
                      cx="48" cy="48" r="40" 
                      stroke="url(#purpleGradient)" 
                      strokeWidth="6" 
                      fill="none" 
                      strokeDasharray="251.2" 
                      initial={{ strokeDashoffset: 251.2 }}
                      animate={{ strokeDashoffset: 251.2 - (251.2 * data.summary.teamProductivity / 100) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#9333ea" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <Activity size={24} className="absolute text-purple-400" />
                </div>
              </div>
            </div>

            {/* 2. The Three Scenario Engine */}
            <div>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BrainCircuit size={14} /> SCENARIO SIMULATION ENGINE
              </h2>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { 
                    id: 'slow', data: data.scenarios.slow, 
                    colors: { bg: 'from-red-900/20 to-transparent', border: 'border-red-500/30', accent: 'text-red-400', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.1)]' } 
                  },
                  { 
                    id: 'baseline', data: data.scenarios.baseline, 
                    colors: { bg: 'from-amber-900/20 to-transparent', border: 'border-amber-500/30', accent: 'text-amber-400', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.1)]' } 
                  },
                  { 
                    id: 'fast', data: data.scenarios.fast, 
                    colors: { bg: 'from-emerald-900/20 to-transparent', border: 'border-emerald-500/30', accent: 'text-emerald-400', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.1)]' } 
                  }
                ].map((scenario, i) => (
                  <motion.div
                    key={scenario.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (i * 0.15) }}
                    onClick={() => setActiveScenario(scenario.id)}
                    className={`cursor-pointer rounded-2xl border p-6 relative overflow-hidden transition-all duration-300 ${scenario.colors.border} ${activeScenario === scenario.id ? scenario.colors.glow + ' bg-gradient-to-b ' + scenario.colors.bg : 'bg-[#121a2f]/50 hover:bg-[#121a2f] opacity-70 hover:opacity-100'}`}
                  >
                    {activeScenario === scenario.id && (
                      <div className={`absolute top-0 left-0 w-full h-1 bg-current ${scenario.colors.accent}`}></div>
                    )}
                    
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-sm font-bold tracking-wider">{scenario.data.label}</h3>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold bg-white/10 ${scenario.colors.accent}`}>
                        {scenario.data.modifier > 0 ? '+' : ''}{scenario.data.modifier}%
                      </span>
                    </div>

                    <div className="mb-6">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">EXPECTED COMPLETION</span>
                      <div className="text-3xl font-light text-white">{scenario.data.expectedCompletionDays} DAYS</div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Date</span>
                        <span className="font-medium text-white flex items-center gap-1"><Calendar size={12}/> {scenario.data.estimatedCompletionDate}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Delay Risk</span>
                        <span className={`font-medium ${scenario.colors.accent}`}>{scenario.data.delayRisk}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Critical Path Impact</span>
                        <span className={`font-medium ${scenario.colors.accent}`}>{scenario.data.criticalPathImpact}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 3. Task Forecast & Gantt section */}
            <div className="grid grid-cols-12 gap-6">
              {/* Task Table */}
              <div className="col-span-7 bg-[#121a2f]/80 border border-white/5 rounded-xl backdrop-blur-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                  <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2">
                    <Info size={16} className="text-blue-400"/> TASK-BY-TASK FORECAST
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-white/5 text-gray-400 border-b border-white/5">
                        <th className="p-3 font-medium">#</th>
                        <th className="p-3 font-medium">ACTIVITY</th>
                        <th className="p-3 font-medium">PROGRESS</th>
                        <th className="p-3 font-medium text-center bg-white/5">SCENARIO EST.</th>
                        <th className="p-3 font-medium text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tasks.map((task, idx) => (
                        <tr 
                          key={task.id} 
                          onClick={() => setSelectedTask(task)}
                          className={`border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${selectedTask?.id === task.id ? 'bg-white/10' : ''}`}
                        >
                          <td className="p-3 text-gray-500">{task.taskId}</td>
                          <td className="p-3 font-medium text-gray-200">{task.taskName}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="w-8">{task.currentProgress}%</span>
                              <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden">
                                <motion.div 
                                  className={`h-full ${task.currentProgress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${task.currentProgress}%` }}
                                  transition={{ duration: 1, delay: idx * 0.05 }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center bg-white/5 font-medium">
                            {task.currentProgress === 100 ? (
                              <span className="text-gray-500">—</span>
                            ) : (
                              <AnimatePresence mode="wait">
                                <motion.span
                                  key={activeScenario}
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 5 }}
                                  className={activeScenario === 'slow' ? 'text-red-400' : activeScenario === 'fast' ? 'text-emerald-400' : 'text-amber-400'}
                                >
                                  {activeScenario === 'slow' ? task.slowScenarioDays : activeScenario === 'fast' ? task.fastScenarioDays : task.baselineDays} d
                                </motion.span>
                              </AnimatePresence>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                              task.currentProgress === 100 ? 'bg-emerald-500/20 text-emerald-400' : 
                              task.currentProgress > 0 ? 'bg-amber-500/20 text-amber-400' : 
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {task.currentProgress === 100 ? 'Completed' : task.currentProgress > 0 ? 'In Progress' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Animated Gantt / Future Curves */}
              <div className="col-span-5 flex flex-col gap-6">
                
                {/* Future Curves Graph */}
                <div className="bg-[#121a2f]/80 border border-white/5 rounded-xl backdrop-blur-sm p-5 h-64 flex flex-col">
                  <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4">PRODUCTIVITY TREND & PROJECTION</h2>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.productivityHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[50, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '12px' }}
                        />
                        <Line type="monotone" dataKey="history" stroke="#3b82f6" strokeWidth={2} dot={{r:3}} />
                        <Line type="monotone" dataKey="fast" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 5" strokeOpacity={activeScenario === 'fast' ? 1 : 0.3} />
                        <Line type="monotone" dataKey="baseline" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 5" strokeOpacity={activeScenario === 'baseline' ? 1 : 0.3} />
                        <Line type="monotone" dataKey="slow" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" strokeOpacity={activeScenario === 'slow' ? 1 : 0.3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Insights & Recommendations Panel */}
                <div className="flex gap-4 h-64">
                  {/* AI Insights Panel */}
                  <div className="bg-gradient-to-br from-[#121a2f] to-purple-900/10 border border-purple-500/20 rounded-xl backdrop-blur-sm p-5 flex-1 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <BrainCircuit size={100} />
                    </div>
                    <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <BrainCircuit size={14} className="text-purple-400"/> AI INSIGHTS
                    </h2>
                    <ul className="space-y-3 relative z-10 overflow-y-auto custom-scrollbar pr-2 flex-1">
                      {data.insights.map((insight, i) => (
                        <motion.li 
                          key={`insight-${i}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + (i * 0.1) }}
                          className="text-sm text-gray-300 flex items-start gap-2"
                        >
                          <ChevronRight size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
                          <span>{insight}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations Panel */}
                  <div className="bg-gradient-to-br from-[#121a2f] to-blue-900/10 border border-blue-500/20 rounded-xl backdrop-blur-sm p-5 flex-1 relative overflow-hidden flex flex-col">
                    <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-blue-400"/> RECOMMENDATIONS
                    </h2>
                    <ul className="space-y-3 relative z-10 overflow-y-auto custom-scrollbar pr-2 flex-1">
                      {data.recommendations.map((rec, i) => (
                        <motion.li 
                          key={`rec-${i}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + (i * 0.1) }}
                          className="text-sm text-gray-300 flex items-start gap-2"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                          <span>{rec}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Task Detail Modal / Panel Overlay (if selected) */}
            <AnimatePresence>
              {selectedTask && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setSelectedTask(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                  >
                    <div className="p-6 border-b border-white/5 flex justify-between items-start">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">ACTIVITY DETAILS</div>
                        <h2 className="text-xl font-bold text-white">{selectedTask.name}</h2>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedTask.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 
                        selectedTask.status === 'In Progress' ? 'bg-amber-500/20 text-amber-400' : 
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {selectedTask.status}
                      </span>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-6 mb-8">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Current Progress</p>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-light">{selectedTask.progress}%</span>
                            <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${selectedTask.progress}%` }}></div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Current Execution Rate</p>
                          <p className="text-2xl font-light">{selectedTask.currentProductivity}</p>
                        </div>
                      </div>

                      <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-4">AI PREDICTION SCENARIOS</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center p-3 rounded-lg bg-red-900/10 border border-red-500/20">
                          <div className="w-32 text-xs font-bold text-red-400">SLOWDOWN</div>
                          <div className="flex-1 text-sm text-gray-300">Estimated completion:</div>
                          <div className="text-lg font-bold text-white">{selectedTask.slowDays} days</div>
                        </div>
                        <div className="flex items-center p-3 rounded-lg bg-amber-900/10 border border-amber-500/20 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                          <div className="w-32 text-xs font-bold text-amber-400 pl-2">BASELINE</div>
                          <div className="flex-1 text-sm text-gray-300">Estimated completion:</div>
                          <div className="text-lg font-bold text-white">{selectedTask.baselineDays} days</div>
                        </div>
                        <div className="flex items-center p-3 rounded-lg bg-emerald-900/10 border border-emerald-500/20">
                          <div className="w-32 text-xs font-bold text-emerald-400">ACCELERATION</div>
                          <div className="flex-1 text-sm text-gray-300">Estimated completion:</div>
                          <div className="text-lg font-bold text-white">{selectedTask.fastDays} days</div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/5 flex justify-between text-xs text-gray-400">
                        <span>Prediction Confidence: <strong className="text-emerald-400">{selectedTask.confidence}%</strong></span>
                        <span>Historical evidence used: <strong>12 previous executions</strong></span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

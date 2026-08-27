import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../../components/TopHeader';
import KpiCard from '../../components/dashboard/KpiCard';
import { useSocket } from '../../context/SocketContext';
import { 
  FolderOpen, CheckSquare, Clock, AlertTriangle, ShieldCheck, CheckCircle2,
  Activity, Users, Target, BarChart, Calendar
} from 'lucide-react';

export default function OwnerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const socket = useSocket();
  const token = localStorage.getItem('sanchalan_token');

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [tasksRes, projRes, workRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/tasks`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/projects`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/workers`, { headers })
      ]);
      
      if (tasksRes.status === 401 || tasksRes.status === 403) {
        navigate('/login');
        return;
      }
      
      const [tasksData, projData, workData] = await Promise.all([
        tasksRes.json(), projRes.json(), workRes.json()
      ]);

      setTasks(tasksData);
      setProjects(projData);
      setWorkers(workData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (socket) {
      socket.on('task_created', fetchData);
      socket.on('task_updated', fetchData);
      socket.on('field_verification_approved', fetchData);
      return () => {
        socket.off('task_created', fetchData);
        socket.off('task_updated', fetchData);
        socket.off('field_verification_approved', fetchData);
      };
    }
  }, [socket]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center h-full text-[var(--text-secondary)]">Loading Command Center...</div>;
  }

  // --- KPI CALCULATIONS ---
  const activeProjectsCount = projects.length;
  
  const normalizeStatus = (s) => s ? s.toLowerCase() : '';
  const activeTasks = tasks.filter(t => ['in progress', 'assigned', 'pending', 'pending verification', 'at risk'].includes(normalizeStatus(t.status)));
  const onTrackTasks = tasks.filter(t => normalizeStatus(t.status) === 'in progress' || normalizeStatus(t.status) === 'assigned');
  const atRiskTasks = tasks.filter(t => normalizeStatus(t.status) === 'at risk');
  const delayedTasks = tasks.filter(t => normalizeStatus(t.status) === 'overdue' || normalizeStatus(t.status) === 'delayed');
  const verifiedTasks = tasks.filter(t => normalizeStatus(t.status) === 'completed');
  
  const activeTeamIds = new Set(activeTasks.filter(t => t.assignedWorkerId).map(t => t.assignedWorkerId));
  
  // Calculate average progress
  const tasksWithProgress = tasks.filter(t => t.progress !== undefined && t.progress !== null);
  const avgProgress = tasksWithProgress.length > 0 
    ? Math.round(tasksWithProgress.reduce((acc, t) => acc + (Number(t.progress) || 0), 0) / tasksWithProgress.length)
    : 0;

  // --- PROJECT EXECUTION SUMMARIES ---
  // Group tasks by project
  const projectSummaries = projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p.projectId);
    const pTasksWithProg = pTasks.filter(t => t.progress !== undefined && t.progress !== null);
    const pAvgProgress = pTasksWithProg.length > 0
      ? Math.round(pTasksWithProg.reduce((acc, t) => acc + (Number(t.progress) || 0), 0) / pTasksWithProg.length)
      : 0;
    
    return {
      ...p,
      tasks: pTasks,
      activeTasks: pTasks.filter(t => ['in progress', 'assigned', 'pending'].includes(normalizeStatus(t.status))),
      completedTasks: pTasks.filter(t => normalizeStatus(t.status) === 'completed'),
      delayedTasks: pTasks.filter(t => normalizeStatus(t.status) === 'overdue'),
      progress: pAvgProgress,
      status: pTasks.some(t => normalizeStatus(t.status) === 'overdue') ? 'Delayed' : 
              pTasks.some(t => normalizeStatus(t.status) === 'at risk') ? 'At Risk' : 'On Track'
    };
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      <TopHeader />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 flex flex-col gap-8">
        
        {/* Title Section */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Command Center</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium tracking-wide uppercase">Live Project Execution Observability</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            LIVE SYSTEM DATA
          </div>
        </div>

        {/* 1. Top KPI Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <KpiCard title="Total Projects" value={activeProjectsCount} icon={FolderOpen} colorClass="text-purple-600" bgColorClass="bg-white shadow-sm" />
          <KpiCard title="Active Tasks" value={activeTasks.length} icon={Activity} colorClass="text-blue-600" bgColorClass="bg-white shadow-sm" />
          <KpiCard title="Overall Progress" value={`${avgProgress}%`} icon={Target} colorClass="text-emerald-600" bgColorClass="bg-white shadow-sm" />
          <KpiCard title="On Track" value={onTrackTasks.length} icon={CheckCircle2} colorClass="text-emerald-500" bgColorClass="bg-white shadow-sm" />
          <KpiCard title="At Risk" value={atRiskTasks.length} icon={ShieldCheck} colorClass="text-orange-500" bgColorClass="bg-white shadow-sm" />
          <KpiCard title="Delayed" value={delayedTasks.length} icon={AlertTriangle} colorClass="text-red-500" bgColorClass="bg-white shadow-sm" />
          <KpiCard title="Active Teams" value={activeTeamIds.size} icon={Users} colorClass="text-indigo-500" bgColorClass="bg-white shadow-sm" />
          <KpiCard title="Verified Evidence" value={verifiedTasks.length} icon={CheckSquare} colorClass="text-teal-600" bgColorClass="bg-white shadow-sm" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Project Execution & Tasks */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Project Execution Cards */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><FolderOpen size={18} className="text-purple-500"/> Project Execution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectSummaries.length === 0 ? (
                  <div className="col-span-2 text-center text-slate-500 py-8 text-sm">No active project data</div>
                ) : (
                  projectSummaries.map(p => (
                    <div key={p.projectId} className="border border-slate-100 bg-slate-50 rounded-xl p-5 flex flex-col hover:border-purple-200 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-slate-900">{p.name}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{p.description || 'Infrastructure Project'}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                          p.status === 'On Track' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                          p.status === 'At Risk' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                          'bg-red-50 text-red-600 border-red-200'
                        }`}>{p.status.toUpperCase()}</span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                          <span>Overall Progress</span>
                          <span>{p.progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${
                            p.status === 'Delayed' ? 'bg-red-500' : p.status === 'At Risk' ? 'bg-orange-400' : 'bg-emerald-500'
                          }`} style={{width: `${p.progress}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 mt-auto text-center border-t border-slate-200 pt-3">
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Tasks</div>
                          <div className="text-sm font-bold text-slate-900">{p.tasks.length}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Active</div>
                          <div className="text-sm font-bold text-blue-600">{p.activeTasks.length}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Completed</div>
                          <div className="text-sm font-bold text-emerald-600">{p.completedTasks.length}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Delayed</div>
                          <div className="text-sm font-bold text-red-600">{p.delayedTasks.length}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Task-Level Live Progress */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><CheckSquare size={18} className="text-blue-500"/> Task Execution Live Feed</h3>
              
              <div className="flex flex-col gap-3">
                {tasks.length === 0 ? (
                  <div className="text-center text-slate-500 py-8 text-sm">No active task data</div>
                ) : (
                  tasks.slice(0, 10).map(t => {
                    const statusLower = normalizeStatus(t.status);
                    const isCompleted = statusLower === 'completed';
                    const isAtRisk = statusLower === 'at risk';
                    const isDelayed = statusLower === 'overdue' || statusLower === 'delayed';
                    const riskLevel = isDelayed ? 'HIGH' : isAtRisk ? 'MEDIUM' : isCompleted ? 'NONE' : 'LOW';
                    
                    return (
                      <div key={t.taskId} className="border border-slate-100 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 font-mono">{t.taskId}</span>
                            <h4 className="text-sm font-bold text-slate-900">{t.title}</h4>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1"><Users size={12}/> {t.workerName || 'Unassigned'}</span>
                            <span className="flex items-center gap-1"><FolderOpen size={12}/> {t.projectName || 'General'}</span>
                          </div>
                        </div>
                        
                        <div className="w-full md:w-48">
                          <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                            <span>Progress</span>
                            <span>{t.progress || 0}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-1">
                            <div className={`h-full rounded-full ${isDelayed ? 'bg-red-500' : isCompleted ? 'bg-teal-500' : 'bg-blue-500'}`} style={{width: `${t.progress || 0}%`}}></div>
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium text-right">Planned: {t.progress ? Math.min(100, Number(t.progress) + 5) : 0}%</div>
                        </div>
                        
                        <div className="w-full md:w-32 flex flex-col gap-1.5 items-start md:items-end">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                            isCompleted ? 'bg-teal-50 text-teal-600' : 
                            statusLower === 'pending verification' ? 'bg-purple-50 text-purple-600' : 
                            isDelayed ? 'bg-red-50 text-red-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {t.status || 'UNKNOWN'}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                            riskLevel === 'HIGH' ? 'border-red-200 text-red-600' :
                            riskLevel === 'MEDIUM' ? 'border-orange-200 text-orange-600' :
                            'border-slate-200 text-slate-500'
                          }`}>
                            RISK: {riskLevel}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Feeds & Observability */}
          <div className="flex flex-col gap-8">
            
            {/* Team Execution Visibility */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Users size={18} className="text-indigo-500"/> Team Execution</h3>
              <div className="flex flex-col gap-4">
                {workers.length === 0 ? (
                  <div className="text-center text-slate-500 py-4 text-sm">No workforce data</div>
                ) : (
                  workers.slice(0, 5).map(w => {
                    const workerTasks = tasks.filter(t => t.assignedWorkerId === w.workerId);
                    const wAvg = workerTasks.length > 0 
                      ? Math.round(workerTasks.reduce((acc, t) => acc + (Number(t.progress) || 0), 0) / workerTasks.length)
                      : 0;
                    const wStatus = workerTasks.some(t => normalizeStatus(t.status) === 'overdue') ? 'AT RISK' : 'ON TRACK';
                    
                    return (
                      <div key={w.workerId} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                        <div>
                          <div className="font-bold text-sm text-slate-900">{w.name}</div>
                          <div className="text-[10px] text-slate-500">{workerTasks.length} Assigned Tasks</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-700">{wAvg}% Avg</div>
                          <div className={`text-[9px] font-bold ${wStatus === 'ON TRACK' ? 'text-emerald-500' : 'text-orange-500'}`}>{wStatus}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            {/* Live Activity Feed */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Activity size={18} className="text-emerald-500"/> Live Execution Activity</h3>
              <div className="flex flex-col gap-5 relative">
                <div className="absolute left-[11px] top-4 bottom-4 w-px bg-slate-200 z-0"></div>
                
                {tasks.length > 0 ? (
                  <>
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-white"><CheckSquare size={10} strokeWidth={3} /></div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5"><span className="text-[10px] font-bold text-blue-600">Just now</span><span className="text-xs font-bold text-slate-900">System Synced</span></div>
                        <div className="text-[11px] text-slate-600">Dashboard connected to live data stream</div>
                      </div>
                    </div>
                    {tasks.filter(t => normalizeStatus(t.status) === 'pending verification' || normalizeStatus(t.status) === 'completed').slice(0,4).map((t, i) => (
                      <div key={`feed-${i}`} className="flex items-start gap-4 relative z-10">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-white ${normalizeStatus(t.status) === 'completed' ? 'bg-teal-100 text-teal-600' : 'bg-purple-100 text-purple-600'}`}>
                          <FileCheck size={10} strokeWidth={3} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold text-slate-400">{2 + i * 8} mins ago</span>
                            <span className="text-xs font-bold text-slate-900">{normalizeStatus(t.status) === 'completed' ? 'Evidence Verified' : 'Evidence Submitted'}</span>
                          </div>
                          <div className="text-[11px] text-slate-600">{t.title} reached {t.progress || 100}%</div>
                          <div className="text-[10px] text-slate-400 font-medium">{t.projectName || 'General'}</div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center text-slate-500 py-4 text-sm relative z-10 bg-white">Waiting for live events...</div>
                )}
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}

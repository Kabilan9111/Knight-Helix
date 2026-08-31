import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobileAuth } from '../context/MobileAuthContext';
import { useSocket } from '../../context/SocketContext';
import { 
  cacheTasks, getCachedTasks, cacheProjects, getCachedProjects 
} from '../../services/mobileOfflineStore';
import { 
  CheckCircle2, Clock, AlertTriangle, Navigation, Camera, 
  ArrowRight, Activity, ShieldCheck, HardHat, RefreshCw, 
  TrendingUp, Users, ChevronRight, Sparkles, MapPin, Layers
} from 'lucide-react';

import { API_URL } from '../config';

export default function MobileHome() {
  const { user, token, isOnline, outboxCount } = useMobileAuth();
  const navigate = useNavigate();
  const socket = useSocket();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('PROJ-001');
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      if (isOnline && token) {
        // Fetch projects
        const projRes = await fetch(`${API_URL}/api/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (projRes.ok) {
          const projs = await projRes.json();
          setProjects(projs);
          await cacheProjects(projs);
        }

        // Fetch stats
        const statsRes = await fetch(`${API_URL}/api/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats(s);
        }

        // Fetch tasks
        const taskUrl = user?.role === 'WORKER' && user.workerId 
          ? `${API_URL}/api/tasks?workerId=${user.workerId}` 
          : `${API_URL}/api/tasks`;
        const taskRes = await fetch(taskUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (taskRes.ok) {
          const t = await taskRes.json();
          setTasks(t);
          await cacheTasks(t);
        }

        // Fetch pending verifications if Admin/Site Engineer
        if (user?.role === 'ADMIN' || user?.role === 'SITE_ENGINEER') {
          const verifRes = await fetch(`${API_URL}/api/admin/verifications/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (verifRes.ok) {
            const v = await verifRes.json();
            setPendingVerifications(v);
          }
        }
      } else {
        // Offline: Load from IndexedDB
        const cachedT = await getCachedTasks();
        const cachedP = await getCachedProjects();
        if (cachedT && cachedT.length > 0) setTasks(cachedT);
        if (cachedP && cachedP.length > 0) setProjects(cachedP);
      }
    } catch (err) {
      console.warn('MobileHome data fetch error:', err);
      const cachedT = await getCachedTasks();
      if (cachedT && cachedT.length > 0) setTasks(cachedT);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (socket) {
      socket.on('task_updated', loadData);
      socket.on('task_created', loadData);
      socket.on('evidence_verified', loadData);
      socket.on('field_verification_approved', loadData);
      return () => {
        socket.off('task_updated', loadData);
        socket.off('task_created', loadData);
        socket.off('evidence_verified', loadData);
        socket.off('field_verification_approved', loadData);
      };
    }
  }, [token, isOnline, user?.role]);

  const activeProject = projects.find(p => p.projectId === selectedProjectId) || projects[0] || {
    name: 'Refinery Expansion Phase 2',
    location: 'Site B - Processing Zone'
  };

  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'In Progress');
  const atRiskTasks = tasks.filter(t => t.status === 'At Risk' || t.status === 'MISSED');
  const avgProgress = tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length) : 0;

  return (
    <div className="p-4 space-y-5 animate-in fade-in duration-300">
      
      {/* Project Selector Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 p-4 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <MapPin size={14} />
            <span>Active Project & Site</span>
          </div>
          {projects.length > 1 && (
            <select 
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-800/80 border border-slate-700 text-xs font-semibold text-white px-2.5 py-1 rounded-lg outline-none cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        <h2 className="text-lg font-black text-white tracking-tight leading-snug">
          {activeProject.name}
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          {activeProject.location || 'Site B'} • L5/L6 Linked Execution
        </p>

        {/* Macro KPI Strip */}
        <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 text-center">
            <div className="text-xs text-slate-400 font-bold uppercase">Overall</div>
            <div className="text-xl font-black text-blue-400 mt-0.5">{avgProgress}%</div>
          </div>
          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 text-center">
            <div className="text-xs text-slate-400 font-bold uppercase">Active</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{inProgressTasks.length}</div>
          </div>
          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 text-center">
            <div className="text-xs text-slate-400 font-bold uppercase">At Risk</div>
            <div className="text-xl font-black text-red-400 mt-0.5">{atRiskTasks.length}</div>
          </div>
        </div>
      </div>

      {/* Pending Site Engineer Verification Queue Banner */}
      {(user?.role === 'ADMIN' || user?.role === 'SITE_ENGINEER') && pendingVerifications.length > 0 && (
        <div 
          onClick={() => navigate('/mobile/evidence')}
          className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 p-4 rounded-2xl shadow-lg flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                Verification Queue
              </div>
              <h4 className="text-sm font-black text-white">
                {pendingVerifications.length} Submission{pendingVerifications.length > 1 ? 's' : ''} Awaiting Review
              </h4>
            </div>
          </div>
          <ChevronRight size={20} className="text-emerald-400" />
        </div>
      )}

      {/* Quick Action Grid */}
      <div>
        <div className="text-xs font-black tracking-wider uppercase text-slate-400 mb-2.5 px-1 flex items-center justify-between">
          <span>Field Actions</span>
          <span className="text-[10px] text-blue-400 font-bold">1-Tap Workflows</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          
          {/* Action 1: GPS Field Walk */}
          <div 
            onClick={() => navigate('/mobile/field-walk')}
            className="bg-slate-900/90 border border-amber-500/30 hover:border-amber-400/60 p-4 rounded-2xl shadow-md cursor-pointer active:scale-95 transition-all flex flex-col justify-between min-h-[110px] relative overflow-hidden group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Navigation size={20} />
            </div>
            <div className="mt-2">
              <div className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                GPS Field Walk
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Real-time spatial trace</div>
            </div>
          </div>

          {/* Action 2: Submit Evidence */}
          <div 
            onClick={() => navigate('/mobile/evidence')}
            className="bg-slate-900/90 border border-blue-500/30 hover:border-blue-400/60 p-4 rounded-2xl shadow-md cursor-pointer active:scale-95 transition-all flex flex-col justify-between min-h-[110px] group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Camera size={20} />
            </div>
            <div className="mt-2">
              <div className="text-sm font-black text-white group-hover:text-blue-300 transition-colors">
                Attach Evidence
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Camera & OCR verify</div>
            </div>
          </div>

          {/* Action 3: Risk & Delay Ripple */}
          <div 
            onClick={() => navigate('/mobile/risks')}
            className="bg-slate-900/90 border border-red-500/30 hover:border-red-400/60 p-4 rounded-2xl shadow-md cursor-pointer active:scale-95 transition-all flex flex-col justify-between min-h-[110px] group"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
              <AlertTriangle size={20} />
            </div>
            <div className="mt-2">
              <div className="text-sm font-black text-white group-hover:text-red-300 transition-colors">
                Delay Ripple DAG
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Simulate impact chain</div>
            </div>
          </div>

          {/* Action 4: Plan vs Reality */}
          <div 
            onClick={() => navigate('/mobile/plan-reality')}
            className="bg-slate-900/90 border border-purple-500/30 hover:border-purple-400/60 p-4 rounded-2xl shadow-md cursor-pointer active:scale-95 transition-all flex flex-col justify-between min-h-[110px] group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Activity size={20} />
            </div>
            <div className="mt-2">
              <div className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                Plan vs Reality
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Detect deviations</div>
            </div>
          </div>

        </div>
      </div>

      {/* Active Tasks Section */}
      <div>
        <div className="text-xs font-black tracking-wider uppercase text-slate-400 mb-2.5 px-1 flex items-center justify-between">
          <span>{user?.role === 'WORKER' ? 'My Assigned Tasks' : 'Current Project Tasks'}</span>
          <button 
            onClick={() => navigate('/mobile/tasks')} 
            className="text-[11px] text-blue-400 font-bold flex items-center gap-1 hover:underline"
          >
            View All ({tasks.length}) <ArrowRight size={12} />
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
            No active tasks found for the current filter.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 3).map(task => (
              <div 
                key={task.taskId}
                onClick={() => navigate(`/mobile/tasks?taskId=${task.taskId}`)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl shadow-sm cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded">
                    {task.taskId}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    task.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40' :
                    task.status === 'MISSED' ? 'bg-red-950 text-red-300 border border-red-600/40' :
                    task.status === 'VERIFICATION_PENDING' ? 'bg-indigo-950 text-indigo-300 border border-indigo-600/40' :
                    'bg-amber-950 text-amber-300 border border-amber-600/40'
                  }`}>
                    {task.status}
                  </span>
                </div>

                <h3 className="text-sm font-black text-white leading-tight mb-1">
                  {task.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1 mb-3 font-medium">
                  {task.description}
                </p>

                {/* Progress Bar & Footer */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                    <span>Progress</span>
                    <span className="font-bold text-blue-400">{task.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800/60 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Due: {task.dueDate || 'N/A'}
                  </span>
                  <span className="text-blue-400 font-bold flex items-center gap-1">
                    Details & Activities <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

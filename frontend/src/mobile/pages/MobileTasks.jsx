import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMobileAuth } from '../context/MobileAuthContext';
import { useSocket } from '../../context/SocketContext';
import { cacheTasks, getCachedTasks } from '../../services/mobileOfflineStore';
import { 
  CheckSquare, Clock, Calendar, AlertTriangle, ChevronDown, 
  ChevronUp, Camera, Navigation, ShieldCheck, CheckCircle2, 
  Filter, Search, User, Layers, ArrowLeft
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Countdown Timer component for active activity
function ActivityDeadlineTimer({ activity, taskStatus }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const targetDateStr = activity?.endDate || activity?.startDate;
  if (!targetDateStr) return null;

  const deadlineDate = new Date(targetDateStr);
  deadlineDate.setHours(23, 59, 59, 999);
  const deadlineMs = deadlineDate.getTime();
  const remainingMs = Math.max(0, deadlineMs - now);
  const isCritical = remainingMs > 0 && remainingMs <= 3 * 3600 * 1000;
  const isMissed = activity?.status === 'MISSED' || taskStatus === 'MISSED';

  const formatTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const s = String(totalSecs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  if (isMissed) {
    return (
      <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-3 text-center my-2">
        <span className="text-xs font-black text-red-400 uppercase tracking-wider">🔴 DEADLINE MISSED</span>
      </div>
    );
  }

  if (activity?.status === 'VERIFICATION_PENDING') {
    return (
      <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 text-center my-2">
        <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">✓ EVIDENCE RECEIVED • VERIFICATION PENDING</span>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-xl border text-center my-2 ${
      isCritical 
        ? 'bg-red-950/70 border-red-500/60 text-red-300 animate-pulse' 
        : 'bg-slate-950/60 border-slate-800 text-slate-200'
    }`}>
      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
        {isCritical ? '🔴 CRITICAL TIME REMAINING' : '⏱️ TIME TO DEADLINE'}
      </div>
      <div className="text-2xl font-black font-mono mt-0.5 tracking-tight">
        {formatTime(remainingMs)}
      </div>
      <div className="text-[10px] text-slate-400 mt-0.5">
        Due: {deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, 23:59:59
      </div>
    </div>
  );
}

export default function MobileTasks() {
  const { user, token, isOnline } = useMobileAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedActivities, setExpandedActivities] = useState(new Set());

  const requestedTaskId = searchParams.get('taskId');

  const fetchTasks = async () => {
    try {
      if (isOnline && token) {
        const url = user?.role === 'WORKER' && user.workerId 
          ? `${API_URL}/api/tasks?workerId=${user.workerId}` 
          : `${API_URL}/api/tasks`;
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
          await cacheTasks(data);
          
          if (requestedTaskId) {
            const match = data.find(t => t.taskId === requestedTaskId);
            if (match) loadTaskDetails(match.taskId);
          }
        }
      } else {
        const cached = await getCachedTasks();
        if (cached) setTasks(cached);
      }
    } catch (e) {
      console.warn('Tasks fetch error:', e);
      const cached = await getCachedTasks();
      if (cached) setTasks(cached);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskDetails = async (taskId) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTaskDetails(data);
        setSelectedTask(data.task);
      }
    } catch (err) {
      console.error('Task detail load error:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (socket) {
      socket.on('task_updated', fetchTasks);
      socket.on('evidence_verified', fetchTasks);
      return () => {
        socket.off('task_updated', fetchTasks);
        socket.off('evidence_verified', fetchTasks);
      };
    }
  }, [token, isOnline, user?.role, requestedTaskId]);

  const toggleActivityExpand = (actId) => {
    setExpandedActivities(prev => {
      const next = new Set(prev);
      if (next.has(actId)) next.delete(actId);
      else next.add(actId);
      return next;
    });
  };

  const filteredTasks = tasks.filter(t => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter || 
      (statusFilter === 'IN_PROGRESS' && (t.status === 'In Progress' || t.status === 'IN_PROGRESS')) ||
      (statusFilter === 'MISSED' && (t.status === 'MISSED' || t.status === 'Overdue'));
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.taskId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.site && t.site.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Render Task Detail View if task is selected
  if (selectedTask && taskDetails) {
    const { task, activities = [], verifications = [] } = taskDetails;

    return (
      <div className="p-4 space-y-4 animate-in slide-in-from-right duration-200">
        
        {/* Top Return Header */}
        <button 
          onClick={() => { setSelectedTask(null); setTaskDetails(null); }}
          className="flex items-center gap-2 text-xs font-bold text-blue-400 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl shadow-sm hover:bg-slate-800"
        >
          <ArrowLeft size={16} /> Back to Tasks List
        </button>

        {/* Task Overview Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800/40">
              {task.taskId}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full uppercase bg-amber-950 text-amber-300 border border-amber-500/40">
              {task.status}
            </span>
          </div>

          <h1 className="text-lg font-black text-white leading-tight">
            {task.title}
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            {task.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <div><strong className="text-slate-200">Site:</strong> {task.site || 'Site B'}</div>
            <div><strong className="text-slate-200">Assigned:</strong> {task.workerName || task.assignedWorkerId}</div>
            <div><strong className="text-slate-200">Start:</strong> {task.startDate}</div>
            <div><strong className="text-slate-200">Due:</strong> {task.dueDate}</div>
          </div>

          {/* Overall Progress */}
          <div className="space-y-1 pt-2">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>Overall Progress</span>
              <span className="text-blue-400">{task.progress || 0}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" 
                style={{ width: `${task.progress || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* L5/L6 Activities Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <Layers size={14} className="text-blue-400" />
              L5/L6 Activity Breakdown ({activities.length})
            </h3>
          </div>

          {activities.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
              No sub-activities mapped for this task.
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => {
                const isExpanded = expandedActivities.has(act.activityId);
                const actVerif = verifications.filter(v => v.matchedActivityId === act.activityId);

                return (
                  <div 
                    key={act.activityId}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3"
                  >
                    <div 
                      onClick={() => toggleActivityExpand(act.activityId)}
                      className="flex items-start justify-between cursor-pointer"
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">
                            L6 • {act.activityId.substring(0, 10)}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded uppercase ${
                            act.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300' :
                            act.status === 'VERIFICATION_PENDING' ? 'bg-indigo-950 text-indigo-300' :
                            act.status === 'MISSED' ? 'bg-red-950 text-red-300' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {act.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {act.name}
                        </h4>
                      </div>
                      <button className="text-slate-400 p-1">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-300">
                        <span>Completion</span>
                        <span className="font-bold text-blue-400">{act.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${act.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Live Execution Timer */}
                    <ActivityDeadlineTimer activity={act} taskStatus={task.status} />

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => navigate(`/mobile/evidence?taskId=${task.taskId}&activityId=${act.activityId}`)}
                        className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
                      >
                        <Camera size={14} /> Submit Photo
                      </button>
                      <button
                        onClick={() => navigate(`/mobile/field-walk?taskId=${task.taskId}&activityId=${act.activityId}`)}
                        className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
                      >
                        <Navigation size={14} /> GPS Field Walk
                      </button>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs space-y-2 animate-in fade-in duration-150">
                        <div>
                          <span className="text-slate-400 font-bold">Activity Description:</span>
                          <p className="text-slate-200 mt-0.5">{act.description || 'No additional details provided.'}</p>
                        </div>
                        <div className="flex justify-between text-slate-400 pt-1">
                          <span>Start: {act.startDate || 'N/A'}</span>
                          <span>End: {act.endDate || 'N/A'}</span>
                        </div>
                        {act.aiConfidence && (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold pt-1">
                            <ShieldCheck size={14} /> AI Verification Confidence: {act.aiConfidence}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    );
  }

  // Task List Main View
  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-200">
      
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search tasks by title, ID, or site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar text-xs">
          {[
            { id: 'ALL', label: 'All Tasks' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'ASSIGNED', label: 'Assigned' },
            { id: 'VERIFICATION_PENDING', label: 'Pending' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'MISSED', label: 'Missed' }
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => setStatusFilter(chip.id)}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors ${
                statusFilter === chip.id 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List Cards */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
            No matching tasks found.
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.taskId}
              onClick={() => loadTaskDetails(task.taskId)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl shadow-md cursor-pointer active:scale-[0.99] transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800/40">
                  {task.taskId}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  task.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300' :
                  task.status === 'MISSED' ? 'bg-red-950 text-red-300' :
                  task.status === 'VERIFICATION_PENDING' ? 'bg-indigo-950 text-indigo-300' :
                  'bg-amber-950 text-amber-300'
                }`}>
                  {task.status}
                </span>
              </div>

              <h3 className="text-sm font-black text-white leading-tight">
                {task.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {task.description}
              </p>

              {/* Progress */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                  <span>Progress</span>
                  <span className="font-bold text-blue-400">{task.progress || 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" 
                    style={{ width: `${task.progress || 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800 font-medium">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> Due: {task.dueDate}
                </span>
                <span>{task.site || 'Site B'}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

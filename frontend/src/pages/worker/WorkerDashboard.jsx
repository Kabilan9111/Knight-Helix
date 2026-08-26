import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { ClipboardList, PlayCircle, CheckCircle2, FileCheck, ArrowRight, X, Calendar, MapPin, AlignLeft } from 'lucide-react';
import TaskDetailsModal from './components/TaskDetailsModal';

export default function WorkerDashboard() {
  const { user } = useOutletContext();
  const socket = useSocket();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState('All');

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('sanchalan_token');
      const res = await fetch(`http://localhost:3001/api/tasks?workerId=${user.workerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (socket) {
      socket.on('task_created', fetchTasks);
      socket.on('task_updated', fetchTasks);
      return () => {
        socket.off('task_created', fetchTasks);
        socket.off('task_updated', fetchTasks);
      };
    }
  }, [socket, user.workerId]);

  const assignedCount = tasks.filter(t => t.status === 'ASSIGNED' || t.status === 'Pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'In Progress').length;
  const submittedCount = tasks.filter(t => t.status === 'SUBMITTED' || t.status === 'Pending Verification').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;

  const filteredTasks = tasks.filter(t => {
    if (filter === 'All') return true;
    if (filter === 'Assigned') return t.status === 'ASSIGNED' || t.status === 'Pending';
    if (filter === 'In Progress') return t.status === 'IN_PROGRESS' || t.status === 'In Progress';
    if (filter === 'Submitted') return t.status === 'SUBMITTED' || t.status === 'Pending Verification';
    if (filter === 'Completed') return t.status === 'Completed';
    return true;
  });

  const getPriorityBadge = (p) => {
    if (p === 'High') return 'text-red-600 bg-red-50 border-red-200';
    if (p === 'Medium') return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getStatusBadge = (s) => {
    if (s === 'ASSIGNED' || s === 'Pending') return 'text-blue-600 bg-blue-50 border-blue-200';
    if (s === 'IN_PROGRESS' || s === 'In Progress') return 'text-purple-600 bg-purple-50 border-purple-200';
    if (s === 'SUBMITTED' || s === 'Pending Verification') return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  if (loading) return <div className="p-10 text-[var(--text-secondary)]">Loading your workspace...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">My Assigned Tasks</h1>
        <p className="text-sm text-[var(--text-secondary)]">Overview of your current execution responsibilities.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white rounded-xl p-5 border border-[var(--border-medium)] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ClipboardList size={20} /></div>
            <div className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">Assigned</div>
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{assignedCount < 10 ? `0${assignedCount}` : assignedCount}</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[var(--border-medium)] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><PlayCircle size={20} /></div>
            <div className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">In Progress</div>
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{inProgressCount < 10 ? `0${inProgressCount}` : inProgressCount}</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[var(--border-medium)] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><FileCheck size={20} /></div>
            <div className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">Submitted</div>
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{submittedCount < 10 ? `0${submittedCount}` : submittedCount}</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[var(--border-medium)] shadow-sm opacity-60">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={20} /></div>
            <div className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">Completed</div>
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{completedCount < 10 ? `0${completedCount}` : completedCount}</div>
        </div>
      </div>

      {/* Task Filters */}
      <div className="flex gap-2 mb-6 border-b border-[var(--border-medium)] pb-4">
        {['All', 'Assigned', 'In Progress', 'Submitted', 'Completed'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${filter === f ? 'bg-[var(--text-primary)] text-white' : 'bg-white text-[var(--text-secondary)] border border-[var(--border-medium)] hover:bg-[var(--bg-surface-2)]'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-[var(--border-medium)] border-dashed">
            <CheckCircle2 size={40} className="mx-auto text-[var(--border-strong)] mb-4" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">No tasks found</h3>
            <p className="text-sm text-[var(--text-secondary)]">You have no tasks matching this filter.</p>
          </div>
        ) : filteredTasks.map(task => (
          <div key={task.taskId} className="bg-white rounded-xl border border-[var(--border-medium)] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 justify-between items-center group">
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusBadge(task.status)}`}>
                  {task.status}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityBadge(task.priority)}`}>
                  {task.priority || 'MEDIUM'} PRIORITY
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{task.title}</h3>
              <div className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                {task.taskId} • {task.projectName}
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] font-medium">
                <span className="flex items-center gap-1.5"><MapPin size={14}/> {task.site}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14}/> Due: {task.dueDate}</span>
              </div>
            </div>

            <div>
              <button 
                onClick={() => setSelectedTask(task)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[var(--border-strong)] text-[var(--text-primary)] font-bold text-sm rounded-lg hover:bg-[var(--bg-surface-2)] hover:border-[var(--text-primary)] transition-all"
              >
                VIEW TASK <ArrowRight size={16} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {selectedTask && (
        <TaskDetailsModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onUpdate={fetchTasks}
        />
      )}
    </div>
  );
}

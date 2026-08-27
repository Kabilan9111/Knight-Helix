import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Clock, Search, AlertCircle, FileCheck } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import FieldVerificationWorkspace from '../worker/components/FieldVerificationWorkspace';

export default function AdminEvidenceVerification() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const token = localStorage.getItem('sanchalan_token');
  const socket = useSocket();

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      
      // Filter only tasks that need verification
      const verificationTasks = data.filter(t => 
        t.status === 'SUBMITTED' || 
        t.status === 'Pending Verification' ||
        t.status === 'IN_PROGRESS' || 
        t.status === 'In Progress'
      );
      setTasks(verificationTasks);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (socket) {
      socket.on('task_updated', fetchTasks);
      socket.on('evidence_verified', fetchTasks);
      socket.on('field_verification_approved', fetchTasks);
      return () => {
        socket.off('task_updated', fetchTasks);
        socket.off('evidence_verified', fetchTasks);
        socket.off('field_verification_approved', fetchTasks);
      };
    }
  }, [socket]);

  if (loading) return <div className="flex-1 flex items-center justify-center h-full">Loading Evidence...</div>;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface-2)]">
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-[var(--border-subtle)] bg-white flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={20} className="text-emerald-600" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Site Engineer Workspace</span>
          </div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">Evidence Verification</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Review active tasks and verify spatial execution paths.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={24} />
              <span className="font-medium">{error}</span>
            </div>
            <button onClick={fetchTasks} className="px-4 py-2 bg-white rounded-lg text-sm font-bold shadow-sm">RETRY</button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--text-tertiary)]">
            <FileCheck size={48} className="mb-4 opacity-50" />
            <p className="font-medium">No tasks currently require verification.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tasks.map(task => (
              <div key={task.taskId} className="bg-white border border-[var(--border-subtle)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                      {task.taskId} • {task.projectName || 'Project'}
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight">{task.title}</h3>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mb-6 flex-1">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <MapPin size={14} className="text-[var(--text-tertiary)]" />
                    {task.site || 'Main Site'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Clock size={14} className="text-[var(--text-tertiary)]" />
                    Progress: <span className="font-bold text-[var(--text-primary)]">{task.progress || 0}%</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedTask(task)}
                  className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin size={16} />
                  OPEN VERIFICATION
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <FieldVerificationWorkspace 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onVerified={() => {
            setSelectedTask(null);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
}

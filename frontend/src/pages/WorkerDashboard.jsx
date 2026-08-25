import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { format, differenceInDays } from 'date-fns';
import { LogOut, Upload, Mic, FileText, Send, MapPin, ArrowRight, Camera } from 'lucide-react';

export default function WorkerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateText, setUpdateText] = useState('');
  const [updateProgress, setUpdateProgress] = useState(0);
  
  const navigate = useNavigate();
  const socket = useSocket();
  const user = JSON.parse(localStorage.getItem('sanchalan_user') || '{}');

  const fetchTasks = () => {
    fetch(`http://localhost:3001/api/tasks?workerId=${user.workerId}`)
      .then(r => r.json())
      .then(setTasks)
      .catch(()=>null);
  };

  useEffect(() => {
    if (!user.id || user.role !== 'WORKER') {
      navigate('/');
      return;
    }
    fetchTasks();
  }, [navigate]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchTasks();
    socket.on('task_created', handleUpdate);
    socket.on('task_updated', handleUpdate);
    socket.on('task_deleted', (taskId) => {
      fetchTasks();
      if (selectedTask && selectedTask.taskId === taskId) setSelectedTask(null);
    });
    return () => {
      socket.off('task_created', handleUpdate);
      socket.off('task_updated', handleUpdate);
      socket.off('task_deleted');
    };
  }, [socket, selectedTask]);

  const handleLogout = () => {
    localStorage.removeItem('sanchalan_token');
    localStorage.removeItem('sanchalan_user');
    navigate('/');
  };

  const handleUpdateSubmit = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/tasks/${selectedTask.taskId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: user.workerId,
          progress: updateProgress,
          text: updateText,
          location: 'Field Site (Mock GPS)'
        })
      });
      if (res.ok) {
        setUpdateText('');
        fetchTasks();
        setSelectedTask(null);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'High': return <span className="badge badge-danger">HIGH PRIORITY</span>;
      case 'Medium': return <span className="badge badge-warning">MEDIUM PRIORITY</span>;
      default: return <span className="badge badge-info">LOW PRIORITY</span>;
    }
  };

  if (selectedTask) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center pb-20">
        <div className="w-full max-w-3xl px-6 py-10">
          
          <button 
            className="text-body-small hover:text-[var(--text-primary)] mb-8 transition-colors flex items-center gap-1.5"
            onClick={() => setSelectedTask(null)}
          >
            ← Back to Tasks
          </button>
          
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              {getPriorityBadge(selectedTask.priority)}
              <span className="badge badge-neutral">{selectedTask.status}</span>
            </div>
            
            <h1 className="text-display mb-3">{selectedTask.title}</h1>
            
            <div className="surface-2 rounded-lg p-6 mt-6">
              <h3 className="text-caption mb-4">Project Information</h3>
              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <div className="text-body-small mb-1">Project</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{selectedTask.projectName}</div>
                </div>
                <div>
                  <div className="text-body-small mb-1">Site</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{selectedTask.site}</div>
                </div>
                <div>
                  <div className="text-body-small mb-1">Start Date</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{selectedTask.startDate ? format(new Date(selectedTask.startDate), 'MMM dd, yyyy') : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-body-small mb-1">Deadline</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{selectedTask.dueDate ? format(new Date(selectedTask.dueDate), 'MMM dd, yyyy') : 'N/A'}</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-[var(--border-subtle)] mt-2">
                  <div className="text-body-small mb-1">Execution Description</div>
                  <div className="text-sm text-[var(--text-primary)] leading-relaxed">{selectedTask.description || 'No detailed instructions provided.'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-[var(--accent-primary-subtle)] overflow-hidden">
            <div className="bg-[var(--bg-surface-2)] px-6 py-5 border-b border-[var(--border-subtle)]">
              <h2 className="text-h2">Daily Execution Update</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-8">
                <div className="flex justify-between items-end mb-3">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Execution Progress</label>
                  <span className="text-2xl text-metric text-[var(--accent-primary)]">{updateProgress}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="5"
                  value={updateProgress} 
                  onChange={(e) => setUpdateProgress(Number(e.target.value))}
                  className="w-full accent-[var(--accent-primary)] cursor-pointer h-1.5 bg-[var(--bg-surface-3)] rounded-full appearance-none"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <button className="surface-2 p-4 flex flex-col items-center justify-center gap-3 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary-subtle)] transition-colors group rounded-md">
                  <Camera size={24} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]" />
                  <span className="text-caption group-hover:text-[var(--text-primary)]">Upload Photo</span>
                </button>
                <button className="surface-2 p-4 flex flex-col items-center justify-center gap-3 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary-subtle)] transition-colors group rounded-md">
                  <Mic size={24} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]" />
                  <span className="text-caption group-hover:text-[var(--text-primary)]">Record Voice</span>
                </button>
                <button className="surface-2 p-4 flex flex-col items-center justify-center gap-3 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary-subtle)] transition-colors group rounded-md">
                  <FileText size={24} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]" />
                  <span className="text-caption group-hover:text-[var(--text-primary)]">Write Update</span>
                </button>
                <button className="surface-2 p-4 flex flex-col items-center justify-center gap-3 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary-subtle)] transition-colors group rounded-md">
                  <Upload size={24} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]" />
                  <span className="text-caption group-hover:text-[var(--text-primary)]">Upload Doc</span>
                </button>
              </div>

              <div className="mb-6">
                <textarea 
                  className="input min-h-[120px]" 
                  placeholder="Field notes: What was accomplished? Any blockers?"
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                ></textarea>
              </div>

              <button className="btn btn-primary w-full py-4 text-base" onClick={handleUpdateSubmit}>
                <Send size={18} /> Submit Execution Report
              </button>
              
              <div className="flex items-center justify-center gap-2 mt-5 text-caption text-[var(--text-tertiary)]">
                <MapPin size={12} /> Location Intelligence: Verified
              </div>
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center pb-24">
      
      <header className="w-full max-w-4xl px-6 py-10 flex justify-between items-start border-b border-[var(--border-subtle)] bg-[var(--bg-surface-1)]">
        <div>
          <h1 className="text-h1 font-bold mb-1">Good morning, {user.name ? user.name.split(' ')[0] : 'Worker'}.</h1>
          <p className="text-body-small">Your assigned operational work for today.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-primary-subtle)] border border-[var(--accent-primary)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)] shadow-[0_0_10px_var(--accent-primary-subtle)]">
            {user.name ? user.name.charAt(0) : 'W'}
          </div>
          <button onClick={handleLogout} className="p-2 text-[var(--text-tertiary)] hover:text-[var(--status-critical)] hover:bg-[var(--status-critical-bg)] rounded transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="w-full max-w-4xl px-6 py-10">
        <h2 className="text-caption mb-6">Assigned Work ({tasks.length})</h2>

        <div className="flex flex-col gap-4">
          {tasks.length === 0 ? (
            <div className="surface-2 rounded-lg py-16 text-center text-[var(--text-secondary)]">
              No tasks currently assigned to you.
            </div>
          ) : tasks.map(task => {
            return (
              <div 
                key={task.taskId} 
                className="card p-6 flex flex-col md:flex-row gap-6 justify-between hover:border-[var(--border-strong)] cursor-pointer transition-all duration-200 group"
                onClick={() => { setSelectedTask(task); setUpdateProgress(task.progress); }}
              >
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getPriorityBadge(task.priority)}
                  </div>
                  <h3 className="text-h2 mb-1 group-hover:text-[var(--accent-primary)] transition-colors">{task.title}</h3>
                  <div className="text-sm text-[var(--text-secondary)] uppercase tracking-wide font-medium">{task.projectName} — {task.site}</div>
                </div>
                
                <div className="w-full md:w-64 flex flex-col justify-center">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-caption">Progress</span>
                    <span className="text-metric text-sm text-[var(--accent-primary)]">{task.progress}%</span>
                  </div>
                  <div className="progress-bg h-1.5 mb-4">
                    <div className="progress-fill shadow-[0_0_8px_var(--accent-primary-subtle)]" style={{ width: `${task.progress}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-body-small">
                    <span>Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM dd') : 'N/A'}</span>
                    <span className="text-caption text-[var(--accent-primary)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      OPEN TASK <ArrowRight size={12} />
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </main>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function CreateTaskModal({ onClose, onTaskCreated }) {
  const [formData, setFormData] = useState({
    title: '', description: '', projectId: '', site: '',
    assignedWorkerId: '', priority: 'Medium', startDate: '', dueDate: ''
  });
  
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/projects').then(r => r.json()).then(setProjects).catch(()=>null);
    fetch('http://localhost:3001/api/workers').then(r => r.json()).then(setWorkers).catch(()=>null);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onTaskCreated();
        onClose();
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(8,11,18,0.85)] backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-8 overflow-y-auto">
      <div className="card w-full max-w-5xl shadow-2xl border-[var(--border-strong)] bg-[var(--bg-surface-1)] overflow-hidden flex flex-col relative my-auto animate-in fade-in zoom-in-[0.98] duration-200">
        
        <div className="flex justify-between items-center px-8 py-6 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-h2">Assign Task</h2>
            <p className="text-body-small mt-1">Deploy operational work to field teams.</p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-10">
            
            <section>
              <h3 className="text-caption mb-5">1. Task Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                <div className="md:col-span-2">
                  <label className="input-label">Task Name</label>
                  <input name="title" className="input text-base py-2.5 font-medium" required onChange={handleChange} placeholder="e.g. Pipeline Pressure Testing" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="input-label">Description</label>
                  <textarea name="description" className="input resize-none" rows="3" onChange={handleChange} placeholder="Clear, actionable instructions..."></textarea>
                </div>
                
                <div>
                  <label className="input-label">Project</label>
                  <select name="projectId" className="input cursor-pointer" required onChange={handleChange}>
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="input-label">Site / Location</label>
                  <input name="site" className="input" onChange={handleChange} placeholder="e.g. Block A - Zone 1" />
                </div>

                <div>
                  <label className="input-label">Priority</label>
                  <div className="flex bg-[var(--bg-surface-2)] border border-[var(--border-medium)] rounded-[4px] p-1">
                    {['Low', 'Medium', 'High'].map(p => (
                      <button 
                        key={p} type="button" 
                        onClick={() => setFormData({...formData, priority: p})} 
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-[3px] transition-all duration-200 ${
                          formData.priority === p 
                            ? p === 'High' ? 'bg-[var(--status-critical)] text-white shadow-sm' : 
                              p === 'Medium' ? 'bg-[var(--status-warning)] text-white shadow-sm' : 
                              'bg-[var(--status-info)] text-white shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </section>

            <hr className="border-[var(--border-subtle)]" />

            <section>
              <h3 className="text-caption mb-5">2. Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="input-label">Start Date</label>
                  <input type="date" name="startDate" className="input" onChange={handleChange} />
                </div>
                <div>
                  <label className="input-label">Due Date (Required)</label>
                  <input type="date" name="dueDate" className="input" required onChange={handleChange} />
                </div>
              </div>
            </section>

            <hr className="border-[var(--border-subtle)]" />

            <section>
              <h3 className="text-caption mb-5">3. Assign Worker</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workers.map(w => {
                  const isSelected = formData.assignedWorkerId === w.workerId;
                  return (
                    <div 
                      key={w.workerId} 
                      className={`surface-2 p-4 cursor-pointer transition-all duration-200 relative group overflow-hidden ${
                        isSelected 
                          ? 'border-[var(--accent-primary)] bg-[var(--bg-surface-3)]' 
                          : 'hover:border-[var(--border-strong)]'
                      }`}
                      onClick={() => setFormData({ ...formData, assignedWorkerId: w.workerId })}
                    >
                      <div className={`absolute top-3 right-3 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white' : 'border-[var(--border-strong)] opacity-0 group-hover:opacity-100'}`}>
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-medium)] flex items-center justify-center text-sm font-semibold text-[var(--text-primary)] shadow-inner">
                          {w.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[var(--text-primary)]">{w.name}</div>
                          <div className="text-[10px] font-mono text-[var(--text-tertiary)]">{w.workerId}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
                          <span className={`w-1.5 h-1.5 rounded-full ${w.status === 'AVAILABLE' ? 'bg-[var(--status-success)] shadow-[0_0_5px_var(--status-success)]' : 'bg-[var(--status-warning)]'}`}></span> 
                          {w.status}
                        </span>
                        <span className="text-[11px] font-medium text-[var(--text-tertiary)]">3 active tasks</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </form>
        </div>

        <div className="px-8 py-5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-2)] flex justify-between items-center mt-auto">
          <div className="text-body-small">
            {formData.assignedWorkerId ? <span className="text-[var(--text-primary)] font-medium">1 Worker selected</span> : 'No worker selected'}
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn btn-secondary px-6" onClick={onClose}>Cancel</button>
            <button type="submit" form="task-form" className="btn btn-primary px-8">Assign Task</button>
          </div>
        </div>
        
      </div>
    </div>
  );
}

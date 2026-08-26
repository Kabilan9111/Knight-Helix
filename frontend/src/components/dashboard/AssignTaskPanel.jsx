import React, { useState, useEffect } from 'react';
import { PlusSquare, Calendar as CalendarIcon, Sparkles } from 'lucide-react';

export default function AssignTaskPanel({ projects, workers, onAssign, onAssignWithAI }) {
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    assignedWorkerId: '',
    site: 'Site B - Construction Area',
    startDate: '25 Aug 2026',
    dueDate: '28 Aug 2026',
    priority: 'High',
    description: ''
  });

  // Preselect values if available
  useEffect(() => {
    if (projects.length > 0 && !formData.projectId) {
      setFormData(prev => ({ ...prev, projectId: projects[0].projectId }));
    }
    if (workers.length > 0 && !formData.assignedWorkerId) {
      setFormData(prev => ({ ...prev, assignedWorkerId: workers[0].workerId }));
    }
  }, [projects, workers]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) {
      formData.title = 'Pump Foundation Excavation (CIV-101)';
    }
    onAssign(formData);
    setFormData(prev => ({ ...prev, title: '', description: '' })); // Reset some fields
  };

  return (
    <div className="w-[340px] flex-shrink-0 bg-purple-50/30 rounded-xl border border-purple-100 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className="text-[var(--accent-primary)]">
          <PlusSquare size={20} strokeWidth={2.5} />
        </div>
        <h3 className="text-lg font-bold text-[var(--accent-primary)]">Assign New Task</h3>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Project</label>
          <select 
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            className="w-full bg-white border border-[var(--border-medium)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary-subtle)]"
          >
            {projects.map(p => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
            {projects.length === 0 && <option value="proj1">Project Alpha - Refinery Expansion</option>}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Activity (L5/L6)</label>
          <input 
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Pump Foundation Excavation (CIV-101)"
            className="w-full bg-white border border-[var(--border-medium)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary-subtle)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Assign To</label>
          <select 
            name="assignedWorkerId"
            value={formData.assignedWorkerId}
            onChange={handleChange}
            className="w-full bg-white border border-[var(--border-medium)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary-subtle)]"
          >
            {workers.map(w => <option key={w.workerId} value={w.workerId}>{w.name}</option>)}
            {workers.length === 0 && <option value="w1">Team Alpha</option>}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Location</label>
          <select 
            name="site"
            value={formData.site}
            onChange={handleChange}
            className="w-full bg-white border border-[var(--border-medium)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary-subtle)]"
          >
            <option value="Site B - Construction Area">📍 Site B - Construction Area</option>
            <option value="Site A - Main Plant">📍 Site A - Main Plant</option>
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Planned Start</label>
            <div className="relative">
              <input 
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full bg-white border border-[var(--border-medium)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <CalendarIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Due Date</label>
            <div className="relative">
              <input 
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full bg-white border border-[var(--border-medium)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <CalendarIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Priority</label>
          <select 
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full bg-white border border-[var(--border-medium)] rounded-md px-3 py-2 text-sm text-red-600 font-bold focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary-subtle)]"
          >
            <option value="High">🔴 High</option>
            <option value="Medium">🟠 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Instructions</label>
          <textarea 
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter task instructions..."
            className="w-full h-24 bg-white border border-[var(--border-medium)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary-subtle)] resize-none"
          ></textarea>
        </div>

        <div className="mt-auto pt-4 flex flex-col gap-3">
          <button 
            type="button" 
            onClick={() => onAssignWithAI(formData)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
          >
            <Sparkles size={16} />
            ✨ Assign with AI
          </button>
          
          <div className="flex gap-3">
            <button type="button" onClick={() => setFormData({ ...formData, title: '', description: '' })} className="flex-1 py-2.5 bg-white border border-[var(--border-medium)] text-[var(--text-primary)] font-bold text-sm rounded-lg hover:bg-[var(--bg-surface-2)] transition-colors">
              Reset
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-[var(--accent-primary)] text-white font-bold text-sm rounded-lg shadow-md hover:bg-[var(--accent-primary-hover)] transition-colors">
              Assign Task
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, CheckCircle2, AlertTriangle, Calendar, MapPin, User, Layers, HardHat, FileText, Clock } from 'lucide-react';
import { API_URL } from '../config';

const L6_ACTIVITY_PRESETS = [
  'Pump Foundation Excavation (CIV-101)',
  'Piping Section Alignment (PIP-204)',
  'Electrical Cable Laying (ELE-203)',
  'Steel Structure Erection (STR-110)',
  'Rebar Reinforcement Binding (CIV-102)',
  'Concrete Pouring & Compaction (CIV-103)'
];

export default function MobileAssignTaskModal({ isOpen, onClose, onTaskCreated, onOpenAIPlanner, token }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    site: 'Site B - Construction Area',
    assignedWorkerId: '',
    priority: 'High',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
  });

  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const [projRes, workRes] = await Promise.all([
          fetch(`${API_URL}/api/projects`, { headers }),
          fetch(`${API_URL}/api/workers`, { headers })
        ]);

        if (projRes.ok) {
          const projs = await projRes.json();
          setProjects(projs);
          if (projs.length > 0 && !formData.projectId) {
            const firstP = projs[0];
            setFormData(prev => ({ 
              ...prev, 
              projectId: firstP.projectId,
              site: `${firstP.location || 'Site B'} - Construction Area`
            }));
          }
        }

        if (workRes.ok) {
          const works = await workRes.json();
          setWorkers(works);
          if (works.length > 0 && !formData.assignedWorkerId) {
            setFormData(prev => ({ ...prev, assignedWorkerId: works[0].workerId }));
          }
        }
      } catch (err) {
        console.warn('Failed to load projects/workers for task modal:', err);
      }
    };

    loadData();
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'projectId') {
      const selected = projects.find(p => p.projectId === value);
      setFormData(prev => ({
        ...prev,
        projectId: value,
        site: selected ? `${selected.location || 'Site B'} - Construction Area` : prev.site
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please enter or select a task / L5-L6 activity name.');
      return;
    }
    if (!formData.projectId) {
      setError('Please select a project.');
      return;
    }
    if (!formData.assignedWorkerId) {
      setError('Please select an assigned worker/supervisor.');
      return;
    }
    if (!formData.dueDate) {
      setError('Please select a due date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      onTaskCreated(data.taskId);
      onClose();
    } catch (err) {
      setError(err.message || 'Task assignment failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAIPlannerTrigger = () => {
    const enrichedContext = { ...formData };
    const p = projects.find(x => x.projectId === formData.projectId);
    if (p) enrichedContext.projectName = p.name;
    const w = workers.find(x => x.workerId === formData.assignedWorkerId);
    if (w) enrichedContext.workerName = w.name;

    onOpenAIPlanner(enrichedContext);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl flex-1 flex flex-col overflow-hidden shadow-2xl max-w-lg mx-auto w-full">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Assign Operational Task</h3>
              <p className="text-[10px] text-slate-400 font-medium">Real SQLite & Backend Dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
          
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 text-red-200 rounded-xl flex items-center gap-2 text-xs font-medium">
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Project & Location */}
          <div className="space-y-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1.5">
              <MapPin size={12} /> 1. Project & Real Site Location
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Target Project
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 text-white font-semibold p-2.5 rounded-xl outline-none focus:border-blue-500"
              >
                {projects.map(p => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.name} ({p.location || 'Site'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Site / Location Zone
              </label>
              <select
                name="site"
                value={formData.site}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 text-white font-semibold p-2.5 rounded-xl outline-none focus:border-blue-500"
              >
                <option value="Site B - Construction Area">📍 Site B - Construction Area</option>
                <option value="Site A - Main Plant">📍 Site A - Main Plant</option>
                <option value="Site C - Processing Zone">📍 Site C - Processing Zone</option>
              </select>
            </div>
          </div>

          {/* 2. Activity Details & L5/L6 */}
          <div className="space-y-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1.5">
              <Layers size={12} /> 2. Activity (L5 / L6) & Scope
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Activity Name / Code
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Pump Foundation Excavation (CIV-101)"
                className="w-full bg-slate-900 border border-slate-800 text-white font-medium p-2.5 rounded-xl outline-none focus:border-blue-500 mb-2"
              />

              {/* Quick Template Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {L6_ACTIVITY_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, title: preset }))}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-lg border border-slate-800 font-medium active:scale-95 transition-all text-left"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Instructions / Work Scope
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Specific technical tolerances, quality requirements, and photo evidence needed..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 text-white font-medium p-2.5 rounded-xl outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* 3. Supervisor Assignment & Priority */}
          <div className="space-y-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1.5">
              <HardHat size={12} className="text-amber-400" /> 3. Worker Assignment & Schedule
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Assign To Worker / Supervisor
              </label>
              <select
                name="assignedWorkerId"
                value={formData.assignedWorkerId}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 text-white font-semibold p-2.5 rounded-xl outline-none focus:border-blue-500"
              >
                {workers.map(w => (
                  <option key={w.workerId} value={w.workerId}>
                    {w.name} ({w.workerId}) — {w.team || 'Field Crew'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center gap-1">
                  <Calendar size={11} /> Planned Start
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded-xl outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center gap-1">
                  <Clock size={11} /> Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded-xl outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                {['Low', 'Medium', 'High'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                    className={`py-1.5 rounded-lg text-xs font-black transition-all ${
                      formData.priority === p
                        ? p === 'High' ? 'bg-red-600 text-white shadow-sm' :
                          p === 'Medium' ? 'bg-amber-600 text-white shadow-sm' :
                          'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400'
                    }`}
                  >
                    {p === 'High' ? '🔴 High' : p === 'Medium' ? '🟠 Med' : '🟢 Low'}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
          
          {/* AI Task Assignment Option */}
          <button
            type="button"
            onClick={handleAIPlannerTrigger}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 active:scale-[0.99] text-white rounded-2xl text-xs font-black shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles size={16} /> ✨ Assign Task with AI Planner
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
            >
              <Send size={14} /> Assign Task
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

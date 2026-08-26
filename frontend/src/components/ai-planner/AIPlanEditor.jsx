import React, { useState } from 'react';
import { Edit2, Save, Calendar, MapPin, AlertTriangle, User, Loader2, Sparkles } from 'lucide-react';

export default function AIPlanEditor({ plan, onPlanUpdate, onApprove, onCancel, approving }) {
  const [editing, setEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState({ ...plan });

  const handleSave = () => {
    onPlanUpdate(editedPlan);
    setEditing(false);
  };

  const handleChange = (e) => {
    setEditedPlan({ ...editedPlan, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-[var(--border-subtle)] bg-slate-50 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">AI-Generated Execution Plan</h3>
          <h2 className="text-xl font-bold text-slate-900">{plan.projectName}</h2>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Edit2 size={16} /> Edit Plan
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        
        {/* Top Meta Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-1">
              <User size={14} className="text-blue-500" /> Worker
            </div>
            <div className="font-bold text-slate-900">{plan.workerName}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-1">
              <MapPin size={14} className="text-emerald-500" /> Location
            </div>
            <div className="font-bold text-slate-900">{plan.location}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-1">
              <Calendar size={14} className="text-indigo-500" /> Dates
            </div>
            <div className="font-bold text-slate-900">{plan.startDate} - {plan.dueDate}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-1">
              <AlertTriangle size={14} className="text-rose-500" /> Priority
            </div>
            <div className="font-bold text-slate-900">{plan.priority}</div>
          </div>
        </div>

        {/* Editing Mode vs Display Mode */}
        {editing ? (
          <div className="bg-white border border-[var(--border-medium)] rounded-xl p-6 shadow-sm mb-6 animate-in fade-in">
            <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 border-b pb-2">Edit Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Task Title</label>
                <input name="title" value={editedPlan.title} onChange={handleChange} className="w-full input border-slate-300 rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Worker ID</label>
                <input name="assignedWorkerId" value={editedPlan.assignedWorkerId} onChange={handleChange} className="w-full input border-slate-300 rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Start Date</label>
                <input name="startDate" value={editedPlan.startDate} onChange={handleChange} className="w-full input border-slate-300 rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Due Date</label>
                <input name="dueDate" value={editedPlan.dueDate} onChange={handleChange} className="w-full input border-slate-300 rounded-lg p-2.5 text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-[var(--accent-primary)] text-white text-sm font-bold rounded-lg shadow hover:bg-[var(--accent-primary-hover)] transition-colors">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Execution Schedule
            </h4>
            <div className="space-y-3 pl-3">
              {plan.scheduleSteps && plan.scheduleSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-24 text-xs font-bold text-indigo-600 mt-0.5 shrink-0">{step.date}</div>
                  <div className="text-sm text-slate-800">{step.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rationale */}
        {plan.rationale && (
          <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <h4 className="text-[11px] font-bold text-indigo-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Sparkles size={12} /> AI Rationale
            </h4>
            <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
              {plan.rationale}
            </p>
          </div>
        )}

        {/* Risks */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Detected Risks
          </h4>
          <div className="space-y-3">
            {plan.risks && plan.risks.length > 0 ? plan.risks.map((risk, i) => (
              <div key={i} className={`flex gap-3 p-4 rounded-xl border ${risk.level === 'High' ? 'bg-rose-50 border-rose-200' : risk.level === 'Medium' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <AlertTriangle size={18} className={risk.level === 'High' ? 'text-rose-500' : risk.level === 'Medium' ? 'text-amber-500' : 'text-emerald-500'} />
                <div>
                  <div className={`text-xs font-bold uppercase mb-1 ${risk.level === 'High' ? 'text-rose-700' : risk.level === 'Medium' ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {risk.level} Risk
                  </div>
                  <div className="text-sm text-slate-800">{risk.description}</div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-slate-500">No major risks detected.</div>
            )}
          </div>
        </div>

      </div>

      {/* Approval Footer */}
      <div className="p-6 border-t border-[var(--border-subtle)] bg-slate-50 flex justify-between items-center mt-auto">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-black text-[var(--accent-primary)]">{plan.confidence}%</div>
          <div className="text-xs font-bold text-slate-500 uppercase leading-tight">Plan<br/>Confidence</div>
        </div>
        <div className="flex gap-4">
          <button onClick={onCancel} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button 
            onClick={onApprove} 
            disabled={approving || editing}
            className="flex items-center gap-2 px-8 py-3 bg-[var(--accent-primary)] text-white font-bold rounded-xl shadow-lg hover:bg-[var(--accent-primary-hover)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {approving ? <Loader2 size={18} className="animate-spin" /> : null}
            APPROVE & ASSIGN
          </button>
        </div>
      </div>

    </div>
  );
}

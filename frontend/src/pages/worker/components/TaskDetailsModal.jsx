import React, { useState } from 'react';
import { X, Calendar, MapPin, AlignLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function TaskDetailsModal({ task, onClose, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const token = localStorage.getItem('sanchalan_token');

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await fetch(`http://localhost:3001/api/tasks/${task.taskId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        onUpdate(); // Refetch tasks
        onClose(); // Close modal
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
    setUpdating(false);
  };

  const getPriorityBadge = (p) => {
    if (p === 'High') return 'text-red-600 bg-red-50 border-red-200';
    if (p === 'Medium') return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  // Convert old statuses to new for UI purposes if needed
  const normalizedStatus = (task.status === 'Pending') ? 'ASSIGNED' : 
                           (task.status === 'In Progress') ? 'IN_PROGRESS' : 
                           (task.status === 'Pending Verification') ? 'SUBMITTED' : task.status;

  const currentStep = normalizedStatus === 'ASSIGNED' ? 1 :
                      normalizedStatus === 'IN_PROGRESS' ? 2 :
                      normalizedStatus === 'SUBMITTED' ? 3 : 4;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-surface-2)]">
          <div>
            <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{task.taskId} • {task.projectName}</div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] leading-none">{task.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-tertiary)] hover:bg-[var(--border-subtle)] rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
          
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border uppercase ${getPriorityBadge(task.priority)}`}>
              {task.priority || 'MEDIUM'} PRIORITY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex gap-3">
              <div className="mt-0.5 text-[var(--text-tertiary)]"><MapPin size={18}/></div>
              <div>
                <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Location</div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{task.site}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-0.5 text-[var(--text-tertiary)]"><Calendar size={18}/></div>
              <div>
                <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Timeline</div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{task.startDate} — {task.dueDate}</div>
              </div>
            </div>
            <div className="flex gap-3 col-span-2">
              <div className="mt-0.5 text-[var(--text-tertiary)]"><AlignLeft size={18}/></div>
              <div>
                <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Execution Instructions</div>
                <div className="text-sm text-[var(--text-primary)] leading-relaxed bg-[var(--bg-surface-2)] p-4 rounded-lg border border-[var(--border-subtle)]">
                  {task.description || "No specific instructions provided for this task."}
                </div>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div>
            <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Task Lifecycle</div>
            <div className="flex items-center justify-between relative">
              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-[var(--border-medium)] z-0 rounded-full"></div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-blue-500 z-0 rounded-full transition-all duration-500" style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}></div>
              
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${currentStep >= 1 ? 'bg-blue-500 text-white border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-white text-[var(--text-tertiary)] border-[var(--border-medium)]'}`}>1</div>
                <span className={`text-[10px] font-bold uppercase ${currentStep >= 1 ? 'text-blue-600' : 'text-[var(--text-tertiary)]'}`}>Assigned</span>
              </div>
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${currentStep >= 2 ? 'bg-blue-500 text-white border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-white text-[var(--text-tertiary)] border-[var(--border-medium)]'}`}>2</div>
                <span className={`text-[10px] font-bold uppercase ${currentStep >= 2 ? 'text-blue-600' : 'text-[var(--text-tertiary)]'}`}>In Progress</span>
              </div>
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${currentStep >= 3 ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-white text-[var(--text-tertiary)] border-[var(--border-medium)]'}`}>3</div>
                <span className={`text-[10px] font-bold uppercase ${currentStep >= 3 ? 'text-emerald-600' : 'text-[var(--text-tertiary)]'}`}>Submitted</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-2)] flex justify-end gap-3">
          
          {normalizedStatus === 'ASSIGNED' && (
            <button 
              disabled={updating}
              onClick={() => handleStatusUpdate('IN_PROGRESS')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              Start Execution
            </button>
          )}

          {normalizedStatus === 'IN_PROGRESS' && (
            <button 
              disabled={updating}
              onClick={() => handleStatusUpdate('SUBMITTED')}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck size={18} /> Submit for Verification
            </button>
          )}

          {normalizedStatus === 'SUBMITTED' && (
            <div className="px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold rounded-lg flex items-center gap-2">
              <CheckCircle2 size={18} /> Execution Submitted
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

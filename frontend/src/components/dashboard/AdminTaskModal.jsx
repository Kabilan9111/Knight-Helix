import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, AlignLeft, ShieldCheck, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function AdminTaskModal({ task, onClose }) {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        const token = localStorage.getItem('sanchalan_token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/tasks/${task.taskId}/verifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setVerifications(data);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchVerifications();
  }, [task.taskId]);

  const latestVerif = verifications[0];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
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
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8 custom-scrollbar">
          
          {/* Left: Task Info */}
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div>
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Assigned Worker</div>
              <div className="text-sm font-bold text-blue-600 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700">
                  {task.workerName ? task.workerName.charAt(0) : 'W'}
                </div>
                {task.workerName || task.assignedWorkerId}
              </div>
            </div>
            
            <div>
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Location</div>
              <div className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                <MapPin size={16} className="text-[var(--text-tertiary)]"/> {task.site}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Timeline</div>
              <div className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                <Calendar size={16} className="text-[var(--text-tertiary)]"/> {task.startDate} — {task.dueDate}
              </div>
            </div>
            
            <div className="bg-[var(--bg-surface-2)] p-4 rounded-lg border border-[var(--border-subtle)]">
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Instructions</div>
              <div className="text-sm text-[var(--text-primary)] leading-relaxed">
                {task.description || "No specific instructions provided."}
              </div>
            </div>
          </div>

          {/* Right: AI Evidence Verification */}
          <div className="w-full md:w-1/2 border-l border-[var(--border-subtle)] pl-0 md:pl-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-base font-bold text-indigo-900 tracking-wide uppercase">AI Verification</h3>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-[var(--text-tertiary)]">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-sm font-medium">Loading AI Assessment...</span>
              </div>
            ) : verifications.length === 0 ? (
              <div className="bg-[var(--bg-surface-2)] border border-[var(--border-medium)] border-dashed rounded-xl p-6 text-center">
                <ShieldCheck size={32} className="mx-auto text-[var(--text-tertiary)] mb-3" />
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">No Evidence Submitted</h4>
                <p className="text-xs text-[var(--text-secondary)]">The worker has not yet uploaded proof for AI verification.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* AI Score Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                    <ShieldCheck size={80} />
                  </div>
                  <div className="relative z-10 flex flex-col gap-1">
                    <div className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      Verified Progress
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="text-5xl font-black leading-none">{latestVerif.completionPercentage}%</div>
                      <div className="text-sm font-medium text-indigo-200 pb-1 flex items-center gap-1">
                        <CheckCircle2 size={14}/> CONFIDENCE: {latestVerif.confidence}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Status & Explanation */}
                <div className="space-y-4">
                  <div className={`flex items-start gap-3 p-3 rounded-lg border ${latestVerif.matchStatus === 'MATCH' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {latestVerif.matchStatus === 'MATCH' ? <CheckCircle2 size={18} className="text-emerald-500 mt-0.5" /> : <AlertTriangle size={18} className="text-red-500 mt-0.5" />}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider mb-0.5">EVIDENCE TO TASK MATCH</div>
                      <div className="text-sm font-medium">{latestVerif.matchStatus === 'MATCH' ? 'Strong Match with Assigned Task' : 'Low Confidence / Possible Mismatch'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">AI Explanation</div>
                    <div className="text-sm text-[var(--text-primary)] leading-relaxed bg-[var(--bg-surface-2)] p-4 rounded-lg border border-[var(--border-subtle)]">
                      {latestVerif.explanation}
                    </div>
                  </div>
                </div>
                
                {/* Submitted Evidence Snapshot */}
                <div>
                  <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Latest Worker Submission</div>
                  <div className="bg-white border border-[var(--border-medium)] rounded-xl p-3 shadow-sm flex flex-col gap-3">
                    <div className="text-xs text-[var(--text-tertiary)] flex justify-between">
                      <span>Submitted at:</span>
                      <span className="font-medium text-[var(--text-secondary)]">{new Date(latestVerif.evidenceTime).toLocaleString()}</span>
                    </div>
                    {latestVerif.imageBase64 && (
                      <img src={latestVerif.imageBase64} alt="Evidence" className="w-full h-32 object-cover rounded-lg" />
                    )}
                    {latestVerif.description && (
                      <div className="text-sm text-[var(--text-primary)] italic border-l-2 border-indigo-200 pl-3">
                        "{latestVerif.description}"
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

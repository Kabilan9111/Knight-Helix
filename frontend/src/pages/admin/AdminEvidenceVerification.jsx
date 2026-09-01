import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Clock, Search, AlertCircle, FileCheck, CheckCircle2, XCircle, Info, Calendar } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export default function AdminEvidenceVerification() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const token = localStorage.getItem('sanchalan_token');
  const socket = useSocket();

  const fetchVerifications = async () => {
    try {
      const res = await fetch(`${''}/api/admin/verifications/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch pending verifications');
      const data = await res.json();
      setVerifications(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
    if (socket) {
      socket.on('task_updated', fetchVerifications);
      socket.on('evidence_verified', fetchVerifications);
      return () => {
        socket.off('task_updated', fetchVerifications);
        socket.off('evidence_verified', fetchVerifications);
      };
    }
  }, [socket]);

  const handleResolve = async (action) => {
    if (action === 'REJECT' && !rejectionReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${''}/api/admin/verifications/${selectedEvidence.evidenceId}/resolve`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, rejectionReason })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to resolve verification.');
      }

      setSelectedEvidence(null);
      setRejectionReason('');
      fetchVerifications();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center h-full">Loading Evidence Queue...</div>;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface-2)]">
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-[var(--border-subtle)] bg-white flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={20} className="text-emerald-600" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Site Engineer Workspace</span>
          </div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">Evidence Verification Queue</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Review activity-level evidence submitted by supervisors.</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm border border-emerald-100 flex items-center gap-2">
          <Clock size={16} />
          {verifications.length} Pending Approvals
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
            <button onClick={fetchVerifications} className="px-4 py-2 bg-white rounded-lg text-sm font-bold shadow-sm">RETRY</button>
          </div>
        ) : verifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--text-tertiary)]">
            <FileCheck size={48} className="mb-4 opacity-50" />
            <p className="font-medium text-lg text-gray-500">Queue is clear. No evidence requires verification.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {verifications.map(evidence => (
              <div key={evidence.evidenceId} className="bg-white border border-[var(--border-subtle)] rounded-xl p-0 shadow-sm hover:shadow-md transition-shadow flex overflow-hidden h-64">
                
                {/* Image Thumbnail */}
                <div className="w-1/3 bg-gray-100 flex-shrink-0 relative overflow-hidden group cursor-pointer" onClick={() => setSelectedEvidence(evidence)}>
                  <img src={evidence.imageBase64} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Evidence Thumbnail" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-bold text-sm">VIEW FULL</span>
                  </div>
                </div>

                {/* Details */}
                <div className="w-2/3 p-5 flex flex-col">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1 flex justify-between">
                    <span>{evidence.projectName} • {evidence.taskId}</span>
                    <span className="text-gray-400">{new Date(evidence.evidenceTime).toLocaleTimeString()}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight mb-1 truncate">{evidence.activityName}</h3>
                  <p className="text-xs text-gray-500 font-medium mb-3 truncate">{evidence.taskTitle}</p>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex-1 overflow-hidden">
                    <p className="text-xs text-gray-700 italic line-clamp-3">"{evidence.description}"</p>
                  </div>

                  <div className="mt-4 flex gap-2 pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => setSelectedEvidence(evidence)}
                      className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      REVIEW SUBMISSION
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-full overflow-hidden flex flex-col lg:flex-row animate-in fade-in zoom-in duration-200">
            
            {/* Left: Full Image */}
            <div className="lg:w-1/2 bg-black relative flex items-center justify-center overflow-hidden h-[400px] lg:h-auto">
              <img src={selectedEvidence.imageBase64} className="max-w-full max-h-full object-contain" alt="Full Evidence" />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                <Calendar size={14} />
                Captured: {new Date(selectedEvidence.detectedCaptureDateTime).toLocaleString()}
              </div>
            </div>

            {/* Right: Review Details */}
            <div className="lg:w-1/2 flex flex-col h-[500px] lg:h-[80vh]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-xl font-black text-gray-800">Verify Evidence</h2>
                  <p className="text-sm text-gray-500 font-medium">{selectedEvidence.taskId} — {selectedEvidence.activityName}</p>
                </div>
                <button onClick={() => setSelectedEvidence(null)} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Worker Description</h4>
                  <div className="bg-white border border-gray-200 p-4 rounded-xl text-gray-700 text-sm leading-relaxed shadow-sm">
                    {selectedEvidence.description}
                  </div>
                </div>

                {selectedEvidence.explanation && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase mb-2 flex items-center gap-1"><Info size={14} /> AI Analysis</h4>
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-900 text-sm leading-relaxed">
                      {selectedEvidence.explanation}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="border border-gray-200 p-4 rounded-xl">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Previous Progress</div>
                    <div className="text-xl font-black text-gray-700">{selectedEvidence.currentProgress}%</div>
                  </div>
                  <div className="border border-emerald-200 bg-emerald-50 p-4 rounded-xl">
                    <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">New Verified Progress</div>
                    <div className="text-xl font-black text-emerald-700">{selectedEvidence.recommendedProgress}%</div>
                  </div>
                </div>

                {/* Rejection input */}
                <div className="mb-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Rejection Reason (If rejecting)</h4>
                  <textarea 
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason if rejecting..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none h-24 focus:ring-2 focus:ring-indigo-500 outline-none"
                  ></textarea>
                </div>

              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4 shrink-0">
                <button 
                  onClick={() => handleResolve('REJECT')}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  REJECT SUBMISSION
                </button>
                <button 
                  onClick={() => handleResolve('APPROVE')}
                  disabled={actionLoading}
                  className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={20} /> APPROVE EVIDENCE
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

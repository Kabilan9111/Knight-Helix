import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMobileAuth } from '../context/MobileAuthContext';
import { useSocket } from '../../context/SocketContext';
import { addToOutbox, cacheTasks, getCachedTasks } from '../../services/mobileOfflineStore';
import { 
  Camera, Upload, X, ShieldCheck, CheckCircle2, AlertTriangle, 
  Loader2, Send, Clock, Calendar, CheckSquare, Layers, Eye, RefreshCw,
  Sparkles, FileText, ArrowRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function MobileEvidence() {
  const { user, token, isOnline, triggerSync } = useMobileAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [activeTab, setActiveTab] = useState(user?.role === 'ADMIN' ? 'REVIEW' : 'SUBMIT');
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(searchParams.get('taskId') || '');
  const [activities, setActivities] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState(searchParams.get('activityId') || '');
  
  // Submission Form State
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  // Review Queue State (Site Engineer)
  const [pendingQueue, setPendingQueue] = useState([]);
  const [selectedReviewEvidence, setSelectedReviewEvidence] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [resolvingAction, setResolvingAction] = useState(false);

  const fileInputRef = useRef(null);

  // Load Tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        if (isOnline && token) {
          const url = user?.role === 'WORKER' && user.workerId 
            ? `${API_URL}/api/tasks?workerId=${user.workerId}` 
            : `${API_URL}/api/tasks`;
          const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            setTasks(data);
            if (!selectedTaskId && data.length > 0) setSelectedTaskId(data[0].taskId);
          }
        } else {
          const cached = await getCachedTasks();
          if (cached && cached.length > 0) {
            setTasks(cached);
            if (!selectedTaskId) setSelectedTaskId(cached[0].taskId);
          }
        }
      } catch (e) {
        console.warn('Evidence tasks fetch error:', e);
      }
    };
    fetchTasks();
  }, [token, isOnline]);

  // Load Activities when Task changes
  useEffect(() => {
    if (!selectedTaskId) return;
    const fetchDetails = async () => {
      try {
        if (isOnline && token) {
          const res = await fetch(`${API_URL}/api/tasks/${selectedTaskId}/details`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setActivities(data.activities || []);
            if (!selectedActivityId && data.activities?.length > 0) {
              setSelectedActivityId(data.activities[0].activityId);
            }
          }
        }
      } catch (e) {
        console.warn('Activities load error:', e);
      }
    };
    fetchDetails();
  }, [selectedTaskId, token, isOnline]);

  // Load Pending Verification Queue for Site Engineer
  const fetchPendingQueue = async () => {
    if (!token || (user?.role !== 'ADMIN' && user?.role !== 'SITE_ENGINEER')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/verifications/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingQueue(data);
      }
    } catch (e) {
      console.warn('Pending queue error:', e);
    }
  };

  useEffect(() => {
    fetchPendingQueue();
    if (socket) {
      socket.on('task_updated', fetchPendingQueue);
      socket.on('evidence_verified', fetchPendingQueue);
      return () => {
        socket.off('task_updated', fetchPendingQueue);
        socket.off('evidence_verified', fetchPendingQueue);
      };
    }
  }, [token, user?.role]);

  // Handle Photo Selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    const fileNameLower = file.name.toLowerCase();
    if (fileNameLower.includes('screenshot') || fileNameLower.includes('whatsapp')) {
      setError('Screenshots and forwarded images are not allowed. Please capture or upload original site evidence.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 10MB.');
      return;
    }

    setImage(file);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Evidence (Online AI verification or Offline Outbox)
  const handleSubmitEvidence = async () => {
    if (!image && !description.trim()) {
      setError('Please attach a photo or provide a description of the completed work.');
      return;
    }
    if (!selectedActivityId) {
      setError('Please select an L5/L6 Activity to link this evidence.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isOnline && token) {
        // Online: Direct upload to AI pipeline
        const formData = new FormData();
        if (image) formData.append('image', image);
        formData.append('description', description);
        formData.append('activityId', selectedActivityId);

        const res = await fetch(`${API_URL}/api/tasks/${selectedTaskId}/evidence`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to verify evidence.');

        setSuccessResult({
          type: 'ONLINE',
          verification: data.verification,
          message: 'Evidence submitted & verified by SANCHALAN AI!'
        });
      } else {
        // Offline: Queue to IndexedDB Outbox
        await addToOutbox({
          type: 'EVIDENCE_SUBMISSION',
          endpoint: `${API_URL}/api/tasks/${selectedTaskId}/evidence`,
          payload: {
            activityId: selectedActivityId,
            description,
            imageBase64: preview,
            fileName: image ? image.name : 'evidence.jpg'
          }
        });

        setSuccessResult({
          type: 'OFFLINE',
          message: 'Offline Mode: Evidence stored securely in Outbox. It will sync automatically when Internet returns.'
        });
      }

      // Reset form
      handleRemoveImage();
      setDescription('');
    } catch (err) {
      setError(err.message || 'Evidence submission failed.');
    } finally {
      setLoading(false);
    }
  };

  // Resolve Review Action (Approve / Reject)
  const handleResolveReview = async (action) => {
    if (action === 'REJECT' && !rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    setResolvingAction(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/verifications/${selectedReviewEvidence.evidenceId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, rejectionReason })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Resolution failed');
      }

      setSelectedReviewEvidence(null);
      setRejectionReason('');
      fetchPendingQueue();
    } catch (err) {
      alert(err.message);
    } finally {
      setResolvingAction(false);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-200">
      
      {/* Top Tab Switcher if Site Engineer */}
      {(user?.role === 'ADMIN' || user?.role === 'SITE_ENGINEER') && (
        <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            onClick={() => { setActiveTab('SUBMIT'); setSuccessResult(null); }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'SUBMIT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera size={14} /> Submit Field Evidence
          </button>
          <button
            onClick={() => { setActiveTab('REVIEW'); setSuccessResult(null); }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'REVIEW' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck size={14} /> Review Queue
            {pendingQueue.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-black rounded-full animate-pulse">
                {pendingQueue.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* SUCCESS RESULT SCREEN */}
      {successResult && (
        <div className="bg-slate-900 border border-emerald-500/50 p-5 rounded-2xl shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">{successResult.message}</h3>
              <p className="text-xs text-slate-400 font-medium">Activity Linked & Recorded</p>
            </div>
          </div>

          {successResult.verification && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-bold">Verified Progress:</span>
                <span className="text-sm font-black text-emerald-400">{successResult.verification.completionPercentage}%</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-bold">AI Match Confidence:</span>
                <span className="text-sm font-black text-blue-400">{successResult.verification.confidence}%</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-slate-300 leading-relaxed italic">
                "{successResult.verification.explanation}"
              </div>
            </div>
          )}

          <button
            onClick={() => setSuccessResult(null)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg"
          >
            Submit Another Evidence
          </button>
        </div>
      )}

      {/* TAB 1: SUBMIT EVIDENCE FORM */}
      {activeTab === 'SUBMIT' && !successResult && (
        <div className="space-y-4">
          
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 text-red-200 rounded-xl flex items-center gap-2 text-xs font-medium">
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Task & Activity Selectors */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Select Assigned Task
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => { setSelectedTaskId(e.target.value); setSelectedActivityId(''); }}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-semibold px-3 py-2.5 rounded-xl outline-none focus:border-blue-500"
              >
                {tasks.map(t => (
                  <option key={t.taskId} value={t.taskId}>{t.taskId} — {t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Layers size={12} className="text-blue-400" />
                Linked L5/L6 Activity
              </label>
              <select
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-semibold px-3 py-2.5 rounded-xl outline-none focus:border-blue-500"
              >
                {activities.map(a => (
                  <option key={a.activityId} value={a.activityId}>
                    {a.name} ({a.progress || 0}% Complete)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Photo Capture & Preview Area */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Field Evidence Photo
              </label>
              <span className="text-[10px] text-blue-400 font-bold">Original OCR Verified</span>
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {preview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black min-h-[220px] flex items-center justify-center">
                <img src={preview} alt="Evidence preview" className="max-h-64 object-contain" />
                <button 
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 text-red-400 hover:text-white rounded-full shadow-lg"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-[10px] text-slate-200 font-mono flex items-center gap-1">
                  <Clock size={10} className="text-emerald-400" /> Today (OCR window valid)
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer bg-slate-950/40 active:scale-[0.99] transition-all flex flex-col items-center justify-center group"
              >
                <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Camera size={26} />
                </div>
                <h4 className="text-sm font-black text-white mb-0.5">Tap to Capture Photo</h4>
                <p className="text-[11px] text-slate-400">Direct camera capture or image upload (Max 10MB)</p>
              </div>
            )}
          </div>

          {/* Description Input */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Field Execution Report / Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Completed 600m of trenching along Section A. Excavation depth is 2.1m. Soil is stable and inspected."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-3 rounded-xl outline-none focus:border-blue-500 resize-none placeholder-slate-600 leading-relaxed"
            />
          </div>

          {/* Submit Action */}
          <button
            onClick={handleSubmitEvidence}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Verifying with AI Agent...
              </>
            ) : (
              <>
                <Send size={18} /> {isOnline ? 'Submit & Verify Evidence' : 'Queue to Offline Outbox'}
              </>
            )}
          </button>

        </div>
      )}

      {/* TAB 2: SITE ENGINEER REVIEW QUEUE */}
      {activeTab === 'REVIEW' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              Pending Evidence Reviews ({pendingQueue.length})
            </h3>
            <button 
              onClick={fetchPendingQueue}
              className="text-[11px] text-blue-400 font-bold flex items-center gap-1"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {pendingQueue.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-xs">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2 opacity-60" />
              Queue is clear. No evidence requires verification.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingQueue.map((item) => (
                <div 
                  key={item.evidenceId}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{item.projectName} • {item.taskId}</span>
                    <span>{new Date(item.evidenceTime || item.detectedCaptureDateTime).toLocaleTimeString()}</span>
                  </div>

                  <div className="flex gap-3">
                    {item.imageBase64 && (
                      <img 
                        src={item.imageBase64} 
                        alt="Thumbnail" 
                        onClick={() => setSelectedReviewEvidence(item)}
                        className="w-20 h-20 object-cover rounded-xl border border-slate-700 shrink-0 cursor-pointer"
                      />
                    )}
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-black text-white leading-tight">
                        {item.activityName || 'Field Activity'}
                      </h4>
                      <p className="text-xs text-slate-300 italic line-clamp-2">
                        "{item.description}"
                      </p>
                      <div className="text-[11px] font-bold text-emerald-400">
                        AI Recommended: {item.recommendedProgress || 100}%
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation preview */}
                  {item.explanation && (
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                      <strong className="text-blue-400">AI Note: </strong>{item.explanation}
                    </div>
                  )}

                  {/* Review Action Button */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setSelectedReviewEvidence(item)}
                      className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Eye size={14} /> Full Review
                    </button>
                    <button
                      onClick={() => navigate(`/mobile/field-walk?taskId=${item.taskId}&activityId=${item.activityId}`)}
                      className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Navigation size={14} /> Spatial Walk
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FULL REVIEW MODAL FOR SITE ENGINEER */}
      {selectedReviewEvidence && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div>
                <h3 className="text-sm font-black text-white">Review Evidence Submission</h3>
                <p className="text-[10px] text-slate-400">{selectedReviewEvidence.taskId} — {selectedReviewEvidence.activityName}</p>
              </div>
              <button 
                onClick={() => setSelectedReviewEvidence(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
              {selectedReviewEvidence.imageBase64 && (
                <div className="rounded-xl overflow-hidden bg-black border border-slate-800 max-h-56 flex items-center justify-center">
                  <img src={selectedReviewEvidence.imageBase64} alt="Full Evidence" className="max-h-56 object-contain" />
                </div>
              )}

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Supervisor Description:</span>
                <p className="text-slate-200 leading-relaxed font-medium">{selectedReviewEvidence.description}</p>
              </div>

              {selectedReviewEvidence.explanation && (
                <div className="bg-blue-950/40 p-3.5 rounded-xl border border-blue-500/30 space-y-1">
                  <span className="text-blue-400 font-bold uppercase text-[10px] flex items-center gap-1">
                    <Sparkles size={12} /> AI Multi-Modal Verification Analysis:
                  </span>
                  <p className="text-slate-200 leading-relaxed">{selectedReviewEvidence.explanation}</p>
                </div>
              )}

              {/* Rejection input if needed */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Hold / Rejection Notes (Optional for Hold)</label>
                <input 
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Additional depth grading photo required"
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleResolveReview('REJECT')}
                disabled={resolvingAction}
                className="py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl font-black text-xs shadow-md disabled:opacity-50"
              >
                REJECT / HOLD
              </button>
              <button
                onClick={() => handleResolveReview('APPROVE')}
                disabled={resolvingAction}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-black text-xs shadow-md disabled:opacity-50"
              >
                APPROVE VERIFICATION
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { 
  ArrowLeft, Calendar, Clock, MapPin, User, ChevronDown, ChevronUp, 
  CheckCircle2, ShieldCheck, AlertCircle, Eye, Paperclip, FileText, CheckSquare
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function AdminTaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [expandedActivities, setExpandedActivities] = useState(new Set());

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('sanchalan_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/tasks/${taskId}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setErrorMsg(null);
      } else {
        if (res.status === 401) setErrorMsg("Your session has expired. Please sign in again.");
        else if (res.status === 403) setErrorMsg("Access restricted. You do not have permission to view this task.");
        else if (res.status === 404) setErrorMsg("Task not found.");
        else setErrorMsg("Unable to load task. The server encountered an error.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Unable to connect to the SANCHALAN server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [taskId]);

  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = (payload) => {
      if (payload.taskId === taskId) {
        fetchData();
      }
    };
    
    socket.on('task_updated', handleUpdate);
    socket.on('evidence_verified', handleUpdate);
    
    return () => {
      socket.off('task_updated', handleUpdate);
      socket.off('evidence_verified', handleUpdate);
    };
  }, [socket, taskId]);

  const toggleActivity = (id) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedActivities(newExpanded);
  };

  const expandAll = () => {
    if (data?.activities) {
      setExpandedActivities(new Set(data.activities.map(a => a.activityId)));
    }
  };

  const collapseAll = () => setExpandedActivities(new Set());

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--bg-surface-2)]">
        <div className="text-[var(--text-secondary)] font-medium flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Loading Task Details...
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-8 text-center bg-[var(--bg-surface-2)] h-full flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[var(--border-subtle)] max-w-md w-full">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{errorMsg}</p>
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-sm transition-colors shadow-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.task) {
    return null;
  }

  const { task, activities, verifications } = data;

  const getPriorityBadge = (p) => {
    if (p === 'High') return 'bg-red-50 text-red-700 border-red-200';
    if (p === 'Medium') return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const getStatusBadge = (s) => {
    if (s === 'COMPLETED') return 'bg-emerald-500 text-white border-emerald-600';
    if (s === 'IN_PROGRESS' || s === 'In Progress') return 'bg-indigo-500 text-white border-indigo-600';
    if (s === 'SUBMITTED' || s === 'Pending Verification') return 'bg-orange-500 text-white border-orange-600';
    return 'bg-gray-500 text-white border-gray-600';
  };

  // Mock coordinates for Site B (Or default)
  const defaultCenter = [13.0827, 80.2707];

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface-2)] overflow-hidden">
      {/* Header Bar */}
      <div className="bg-white border-b border-[var(--border-subtle)] px-6 py-4 flex-shrink-0 z-10 shadow-sm relative">
        <button 
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-indigo-600 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to Tasks
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-none">{task.title} <span className="text-gray-400 font-normal ml-2 text-lg">({task.taskId})</span></h1>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPriorityBadge(task.priority)}`}>
                {task.priority || 'Medium'} PRIORITY
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusBadge(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5 font-medium">
                <FileText size={16} className="text-indigo-500" />
                <span className="text-[var(--text-primary)]">Project:</span> {task.projectName || 'Project Alpha'}
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin size={16} className="text-red-500" />
                <span className="text-[var(--text-primary)]">Location:</span> {task.site || 'Site B'}
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <User size={16} className="text-blue-500" />
                <span className="text-[var(--text-primary)]">Assigned To:</span> {task.workerName || task.assignedWorkerId}
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar size={16} className="text-emerald-500" />
                <span className="text-[var(--text-primary)]">Timeline:</span> {task.startDate || 'N/A'} — {task.dueDate || 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-[var(--border-medium)] rounded-md font-medium text-sm text-[var(--text-primary)] hover:bg-gray-50 transition-colors shadow-sm">
              View Analytics
            </button>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-sm transition-colors shadow-sm">
              More Actions
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Two Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Primary Workspace */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          
          {/* Task Breakdown Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold tracking-widest text-[var(--text-tertiary)] uppercase flex items-center gap-2">
                <CheckSquare size={16} /> 
                Task Breakdown ({activities?.length || 0} Activities)
              </h2>
              {activities?.length > 0 && (
                <div className="flex items-center gap-4 text-sm font-medium text-indigo-600">
                  <button onClick={expandAll} className="hover:underline">Expand All</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={collapseAll} className="hover:underline">Collapse All</button>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] overflow-hidden">
              {activities && activities.length > 0 ? (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {activities.map((act) => {
                    const isExpanded = expandedActivities.has(act.activityId);
                    const actVerifications = verifications.filter(v => v.matchedActivityId === act.activityId);
                    const latestVerif = actVerifications[0];

                    return (
                      <div key={act.activityId} className="flex flex-col transition-colors hover:bg-gray-50/50">
                        {/* Activity Header Row */}
                        <div 
                          onClick={() => toggleActivity(act.activityId)}
                          className="flex items-center p-4 cursor-pointer gap-4"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 border border-gray-200">
                            {act.activityNumber}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-[var(--text-primary)] text-[15px] truncate">{act.name}</h3>
                            <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)] mt-1 font-medium">
                              <span className="flex items-center gap-1"><Calendar size={12}/> {act.startDate}</span>
                            </div>
                          </div>
                          
                          <div className="w-[200px] flex-shrink-0">
                            <div className="flex justify-between items-center mb-1 text-xs font-bold">
                              <span className={act.progress === 100 ? 'text-emerald-600' : 'text-indigo-600'}>
                                {act.progress}%
                              </span>
                              <span className="text-gray-400 font-medium">
                                {act.status === 'COMPLETED' ? 'COMPLETED' : (act.progress > 0 ? 'IN PROGRESS' : 'PENDING')}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden relative">
                              <div 
                                className={`absolute h-full rounded-full transition-all duration-1000 ${act.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                style={{ width: `${act.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="w-[100px] flex-shrink-0 text-center flex flex-col items-center justify-center">
                            {act.aiConfidence ? (
                              <>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">AI Confidence</span>
                                <span className={`text-sm font-bold flex items-center gap-1 ${act.aiConfidence >= 85 ? 'text-emerald-600' : 'text-orange-500'}`}>
                                  <ShieldCheck size={14} /> {act.aiConfidence}%
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">—</span>
                            )}
                          </div>
                          
                          <div className="flex-shrink-0 text-gray-400 pl-4">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="bg-[var(--bg-surface-2)] p-6 border-t border-[var(--border-subtle)] text-sm shadow-inner">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                              <div>
                                <h4 className="font-bold text-gray-700 mb-2 uppercase tracking-wide text-xs">Activity Instructions</h4>
                                <p className="text-gray-600 mb-6 leading-relaxed">{act.description}</p>
                                
                                {latestVerif && (
                                  <>
                                    <h4 className="font-bold text-indigo-700 mb-2 flex items-center gap-2 uppercase tracking-wide text-xs">
                                      <ShieldCheck size={16} /> Latest AI Assessment
                                    </h4>
                                    <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm relative overflow-hidden">
                                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                      <p className="text-gray-700 italic leading-relaxed">"{latestVerif.explanation}"</p>
                                      <div className="mt-3 text-xs text-gray-500 flex items-center gap-2 font-medium">
                                        <Clock size={12} /> Verified at {new Date(latestVerif.timestamp).toLocaleString()}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              <div>
                                {actVerifications.length > 0 ? (
                                  <>
                                    <h4 className="font-bold text-gray-700 mb-3 uppercase tracking-wide text-xs">Evidence History</h4>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                      {actVerifications.map((v, i) => (
                                        <div key={v.verificationId} className="flex gap-4 bg-white p-3 rounded-lg border border-[var(--border-subtle)] shadow-sm">
                                          {v.imageBase64 ? (
                                            <img src={v.imageBase64} className="w-20 h-20 object-cover rounded-md border border-gray-200 flex-shrink-0" alt="Evidence" />
                                          ) : (
                                            <div className="w-20 h-20 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
                                              <Eye size={20} />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                              <span className="font-bold text-[13px] text-gray-800">Progress: {v.completionPercentage}%</span>
                                              <span className="text-[11px] font-medium text-gray-500">{new Date(v.evidenceTime).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 line-clamp-3">"{v.description || 'No description provided.'}"</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-gray-400 bg-white rounded-lg border border-dashed border-gray-300 p-6">
                                    <Paperclip size={24} className="mb-2 opacity-50" />
                                    <span className="font-medium text-sm">No evidence submitted yet</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 bg-gray-50">
                  <p>No specific activities mapped. The task is being tracked as a single unit.</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Plan Summary */}
          <div className="mb-8">
             <h2 className="text-sm font-bold tracking-widest text-[var(--text-tertiary)] uppercase flex items-center gap-2 mb-4">
                <FileText size={16} /> AI Plan Summary
              </h2>
              <div className="bg-white rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-6">
                <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                  {task.description}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                  <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800">View AI Plan Details &rarr;</button>
                </div>
              </div>
          </div>
          
        </div>
        
        {/* Right Intelligence Sidebar */}
        <div className="w-[360px] border-l border-[var(--border-subtle)] bg-white flex-shrink-0 flex flex-col overflow-y-auto custom-scrollbar">
          
          {/* Overview */}
          <div className="p-6 border-b border-[var(--border-subtle)] bg-gradient-to-br from-indigo-50/50 to-white">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Task Overview</h3>
            
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-gray-600">Overall Progress</span>
              <span className="text-3xl font-black text-indigo-700 leading-none">{task.progress}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-6 shadow-inner relative">
              <div 
                className={`absolute h-full rounded-full transition-all duration-1000 ${task.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500 bg-gradient-to-r from-indigo-500 to-purple-500'}`} 
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-center">
                 <div className="text-2xl font-bold text-gray-800 mb-1">{verifications.length}</div>
                 <div className="text-[10px] uppercase font-bold text-gray-400">Evidence Submitted</div>
               </div>
               <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-center">
                 <div className="text-2xl font-bold text-gray-800 mb-1 flex justify-center items-center gap-1">
                   {verifications.length > 0 ? (
                     <>
                      <ShieldCheck size={20} className="text-emerald-500" />
                      {verifications[0].confidence}%
                     </>
                   ) : '-'}
                 </div>
                 <div className="text-[10px] uppercase font-bold text-gray-400">Last Confidence</div>
               </div>
            </div>
          </div>

          {/* Location Context */}
          <div className="p-6 border-b border-[var(--border-subtle)]">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Location Context</h3>
            <div className="text-sm font-bold text-gray-800 mb-1">{task.site || 'Site B - Construction Area'}</div>
            <div className="text-xs text-gray-500 mb-4">{task.projectName}</div>
            
            <div className="h-48 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
              <MapContainer 
                center={defaultCenter} 
                zoom={14} 
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={defaultCenter}>
                  <Popup>{task.site}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          {/* Related Documents */}
          <div className="p-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Related Documents</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors group">
                <div className="w-10 h-10 rounded bg-red-50 text-red-500 flex items-center justify-center font-bold">
                  PDF
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">Excavation_Plan_v2.pdf</div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">2.4 MB</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

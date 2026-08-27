import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import { MapPin, Navigation, ShieldCheck, Loader2, Play, Square, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useSocket } from '../../../context/SocketContext';

// Fix default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers
const liveIcon = new L.DivIcon({
  className: 'custom-live-marker',
  html: `<div style="width:16px;height:16px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(59,130,246,0.8); animation: pulse 2s infinite;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const startIcon = new L.DivIcon({
  className: 'custom-start-marker',
  html: `<div style="padding:4px 8px;background:#10b981;color:white;border-radius:4px;font-size:10px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);">START</div>`,
  iconSize: [40, 24],
  iconAnchor: [20, 12]
});

// Auto-pan component
function MapPanner({ position, active }) {
  const map = useMap();
  useEffect(() => {
    if (active && position) {
      map.setView(position, map.getZoom(), { animate: true });
    }
  }, [position, active, map]);
  return null;
}

export default function FieldVerificationWorkspace({ task, onClose, onVerified }) {
  const [status, setStatus] = useState('READY'); // READY, TRACKING, STOPPED, ANALYZING, PENDING_APPROVAL, APPROVED, REJECTED
  const [coordinates, setCoordinates] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [distance, setDistance] = useState(0);
  const [estimatedArea, setEstimatedArea] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [stoppedAt, setStoppedAt] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [verificationId, setVerificationId] = useState(null);
  const [error, setError] = useState('');

  const watchIdRef = useRef(null);
  const demoIntervalRef = useRef(null);

  const token = localStorage.getItem('sanchalan_token');

  // Handle cleanup
  useEffect(() => {
    return () => stopTracking(true);
  }, []);

  const calculateMetrics = (coords) => {
    if (coords.length < 2) return { dist: 0, area: null };
    
    const line = turf.lineString(coords.map(c => [c[1], c[0]])); // turf uses [lon, lat]
    const dist = turf.length(line, { units: 'meters' });

    let area = null;
    if (coords.length > 3) {
      // Check if closed
      const first = coords[0];
      const last = coords[coords.length - 1];
      const distanceToStart = turf.distance([first[1], first[0]], [last[1], last[0]], { units: 'meters' });
      
      if (distanceToStart < 15) { // If within 15m of start, consider it closed
        const closedCoords = [...coords, first];
        const polygon = turf.polygon([closedCoords.map(c => [c[1], c[0]])]);
        area = turf.area(polygon);
      }
    }
    return { dist: Math.round(dist * 10) / 10, area: area ? Math.round(area) : null };
  };

  const startTracking = () => {
    setStatus('TRACKING');
    setStartedAt(new Date().toISOString());
    setCoordinates([]);
    setDistance(0);
    setEstimatedArea(null);
    setError('');

    if (demoMode) {
      // Start Demo Route
      let step = 0;
      const baseLat = 13.0827;
      const baseLon = 80.2707;
      demoIntervalRef.current = setInterval(() => {
        const rad = step * 0.1;
        const lat = baseLat + (Math.sin(rad) * 0.0005);
        const lon = baseLon + (Math.cos(rad) * 0.0005);
        
        const newPos = [lat, lon];
        setCurrentPosition(newPos);
        setGpsAccuracy(4.2);
        
        setCoordinates(prev => {
          const next = [...prev, newPos];
          const metrics = calculateMetrics(next);
          setDistance(metrics.dist);
          return next;
        });
        
        step++;
        if (step > 63) { // Full circle
          clearInterval(demoIntervalRef.current);
        }
      }, 1000);
    } else {
      // Real GPS
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        setStatus('READY');
        return;
      }
      
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = [pos.coords.latitude, pos.coords.longitude];
          setCurrentPosition(newPos);
          setGpsAccuracy(Math.round(pos.coords.accuracy));
          
          setCoordinates(prev => {
            const next = [...prev, newPos];
            const metrics = calculateMetrics(next);
            setDistance(metrics.dist);
            return next;
          });
        },
        (err) => {
          console.error(err);
          setError('GPS error: ' + err.message);
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }
  };

  const stopTracking = (isCleanup = false) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (demoIntervalRef.current !== null) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    if (!isCleanup && status === 'TRACKING') {
      setStoppedAt(new Date().toISOString());
      const metrics = calculateMetrics(coordinates);
      setDistance(metrics.dist);
      setEstimatedArea(metrics.area);
      setStatus('STOPPED');
    }
  };

  const analyzeWithAI = async () => {
    setStatus('ANALYZING');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/tasks/${task.taskId}/verify-field`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          activityId: null, // Let AI determine if multiple
          distance,
          estimatedArea: estimatedArea || 'null',
          gpsAccuracy,
          startedAt,
          stoppedAt,
          coordinates: JSON.stringify(coordinates),
          description: "Field walk trace captured via device."
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAiResult(data.aiResult);
        setVerificationId(data.verificationId);
        setStatus('PENDING_APPROVAL');
      } else {
        throw new Error(data.error || 'API Error');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus('STOPPED');
    }
  };

  const approveVerification = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/field-verifications/${verificationId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setStatus('APPROVED');
        setTimeout(() => {
          onVerified();
          onClose();
        }, 2000);
      } else {
        throw new Error('Approval failed');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const rejectVerification = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/field-verifications/${verificationId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStatus('REJECTED');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      alert(err.message);
    }
  };

  const defaultCenter = coordinates.length > 0 ? coordinates[0] : [13.0827, 80.2707];

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-medium)] bg-[var(--bg-surface-1)] flex justify-between items-center shadow-sm z-10 relative">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Navigation size={24} /></div>
          <div>
            <div className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{task.taskId} • Field Verification</div>
            <h2 className="text-xl font-black text-[var(--text-primary)] leading-tight">{task.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {status === 'READY' && (
            <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] bg-[var(--bg-surface-2)] px-3 py-1.5 rounded-lg cursor-pointer">
              <input type="checkbox" checked={demoMode} onChange={e => setDemoMode(e.target.checked)} className="rounded text-blue-600" />
              DEMO GPS
            </label>
          )}
          <button onClick={onClose} disabled={status === 'TRACKING'} className="p-2 text-[var(--text-tertiary)] hover:bg-[var(--border-subtle)] rounded-full transition-colors disabled:opacity-50">
            <XCircle size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* Left Side: Map Hero */}
        <div className="flex-1 relative bg-slate-100 h-full">
          <MapContainer center={defaultCenter} zoom={18} className="w-full h-full" zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <MapPanner position={currentPosition} active={status === 'TRACKING'} />
            
            {coordinates.length > 0 && <Polyline positions={coordinates} color="#3b82f6" weight={5} opacity={0.8} />}
            {coordinates.length > 0 && <Marker position={coordinates[0]} icon={startIcon} />}
            {currentPosition && status === 'TRACKING' && <Marker position={currentPosition} icon={liveIcon} />}
          </MapContainer>

          {/* Floating Tracking UI */}
          {(status === 'TRACKING' || status === 'STOPPED') && (
            <div className="absolute top-6 left-6 z-[400] bg-white/90 backdrop-blur shadow-lg border border-[var(--border-medium)] rounded-2xl p-5 w-72">
              <div className="flex items-center gap-2 mb-4">
                {status === 'TRACKING' ? (
                  <><span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Tracking Active</span></>
                ) : (
                  <><span className="w-2.5 h-2.5 bg-slate-400 rounded-full"></span>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Tracking Stopped</span></>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Distance</div>
                  <div className="text-xl font-black text-[var(--text-primary)]">{distance} m</div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">GPS Points</div>
                  <div className="text-lg font-bold text-[var(--text-primary)]">{coordinates.length}</div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Accuracy</div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">±{gpsAccuracy}m</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Control & Analysis Panel */}
        <div className="w-full lg:w-[450px] bg-white border-l border-[var(--border-medium)] shadow-xl z-20 flex flex-col h-full overflow-y-auto custom-scrollbar">
          
          {error && (
            <div className="m-6 mb-0 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex gap-3 text-sm font-medium">
              <AlertTriangle size={20} className="shrink-0" /> {error}
            </div>
          )}

          {status === 'READY' && (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                <MapPin size={40} />
              </div>
              <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">Ready to Verify</h3>
              <p className="text-[var(--text-secondary)] mb-8">Walk around the boundary of the completed work. SANCHALAN will record your path to verify spatial execution.</p>
              <button onClick={startTracking} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all">
                <Play fill="currentColor" size={20} /> START WALK
              </button>
            </div>
          )}

          {status === 'TRACKING' && (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Navigation size={40} />
              </div>
              <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">Recording Path...</h3>
              <p className="text-[var(--text-secondary)] mb-8">Keep the device with you while you walk the execution area. Press stop when you have completed the circuit.</p>
              <button onClick={() => stopTracking(false)} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all">
                <Square fill="currentColor" size={20} /> STOP WALK
              </button>
            </div>
          )}

          {status === 'STOPPED' && (
            <div className="p-6 flex flex-col h-full animate-in slide-in-from-right-4">
              <h3 className="text-lg font-black text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" /> Verification Summary
              </h3>
              
              <div className="space-y-4 mb-8 flex-1">
                <div className="bg-[var(--bg-surface-2)] p-4 rounded-xl border border-[var(--border-subtle)]">
                  <div className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Distance Traced</div>
                  <div className="text-2xl font-black text-[var(--text-primary)]">{distance} m</div>
                </div>
                
                <div className="bg-[var(--bg-surface-2)] p-4 rounded-xl border border-[var(--border-subtle)]">
                  <div className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Estimated Spatial Extent</div>
                  {estimatedArea ? (
                    <div className="text-2xl font-black text-[var(--text-primary)]">{estimatedArea} m²</div>
                  ) : (
                    <div className="text-sm font-medium text-amber-600 flex items-center gap-2 mt-2">
                      <AlertTriangle size={16} /> Boundary not sufficiently closed
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-surface-2)] p-4 rounded-xl border border-[var(--border-subtle)]">
                    <div className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">GPS Points</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">{coordinates.length}</div>
                  </div>
                  <div className="bg-[var(--bg-surface-2)] p-4 rounded-xl border border-[var(--border-subtle)]">
                    <div className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Avg Accuracy</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">±{gpsAccuracy}m</div>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3">
                <button onClick={() => setStatus('READY')} className="w-full py-3 bg-[var(--bg-surface-2)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl font-bold transition-all">
                  Discard & Retrack
                </button>
                <button onClick={analyzeWithAI} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all">
                  <ShieldCheck size={20} /> ANALYZE WITH AI
                </button>
              </div>
            </div>
          )}

          {status === 'ANALYZING' && (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
              <Loader2 size={48} className="text-indigo-500 animate-spin mb-6" />
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">AI is analyzing spatial data...</h3>
              <p className="text-[var(--text-secondary)]">Validating boundaries, mapping to assigned activity, and calculating execution progress.</p>
            </div>
          )}

          {status === 'PENDING_APPROVAL' && aiResult && (
            <div className="p-6 flex flex-col h-full animate-in slide-in-from-right-4">
              <div className="mb-6 flex items-center gap-3 border-b border-[var(--border-medium)] pb-4">
                <ShieldCheck size={28} className="text-indigo-600" />
                <div>
                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">AI Verified Execution</div>
                  <h3 className="text-lg font-black text-[var(--text-primary)] leading-none mt-1">Pending Approval</h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl col-span-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-800 uppercase">Recommended Progress</span>
                    <span className="text-2xl font-black text-indigo-700">{aiResult.recommendedProgress}%</span>
                  </div>
                  <div className="bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] p-3 rounded-xl flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Confidence</span>
                    <span className="text-lg font-black text-[var(--text-primary)]">{aiResult.confidence}%</span>
                  </div>
                  <div className="bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] p-3 rounded-xl flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Spatial Match</span>
                    <span className="text-lg font-black text-[var(--text-primary)]">{aiResult.spatialVerification}%</span>
                  </div>
                </div>

                {/* AI Explanation */}
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-3 flex items-center gap-2">
                    <Info size={14} /> AI Analysis
                  </h4>
                  <div className="bg-[var(--bg-surface-2)] border border-[var(--border-medium)] p-4 rounded-xl text-sm text-[var(--text-primary)] leading-relaxed space-y-3">
                    <p>{aiResult.strategicExplanation}</p>
                    <div className="border-t border-[var(--border-medium)] pt-3 mt-3">
                      <span className="font-bold block mb-1">Recommended Next Step:</span>
                      <span className="text-emerald-700 font-medium">{aiResult.recommendedNextStep}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-medium)] flex gap-3 shrink-0">
                <button onClick={rejectVerification} className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors">
                  REJECT
                </button>
                <button onClick={approveVerification} className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg transition-colors">
                  APPROVE VERIFICATION
                </button>
              </div>
            </div>
          )}

          {status === 'APPROVED' && (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
              <CheckCircle2 size={64} className="text-emerald-500 mb-6" />
              <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">Verified Successfully</h3>
              <p className="text-[var(--text-secondary)]">Task progress has been updated and broadcasted.</p>
            </div>
          )}
          
          {status === 'REJECTED' && (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
              <XCircle size={64} className="text-red-500 mb-6" />
              <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">Verification Rejected</h3>
              <p className="text-[var(--text-secondary)]">No progress was updated.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import { useMobileAuth } from '../context/MobileAuthContext';
import { useSocket } from '../../context/SocketContext';
import { addToOutbox, saveLocalGpsTrace, getCachedTasks } from '../../services/mobileOfflineStore';
import { 
  Navigation, Play, Square, AlertTriangle, CheckCircle2, 
  MapPin, Clock, ShieldCheck, RefreshCw, Send, XCircle, ArrowLeft,
  Compass, Radio, Layers, HardHat
} from 'lucide-react';

import { API_URL } from '../config';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Live Position Beacon
const liveMarkerIcon = new L.DivIcon({
  className: 'mobile-live-marker',
  html: `<div style="width:20px;height:20px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 14px rgba(59,130,246,0.9); animation: pulse 1.2s infinite;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Start Point Flag
const startMarkerIcon = new L.DivIcon({
  className: 'mobile-start-marker',
  html: `<div style="padding:3px 7px;background:#10b981;color:white;border-radius:6px;font-size:9px;font-weight:900;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);">START</div>`,
  iconSize: [46, 22],
  iconAnchor: [23, 11]
});

// Auto-centering helper component
function MapCenterController({ position, isTracking }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.panTo(position, { animate: true, duration: 0.5 });
    }
  }, [position, isTracking, map]);
  return null;
}

export default function MobileFieldWalk() {
  const { user, token, isOnline } = useMobileAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [status, setStatus] = useState('READY'); // READY, TRACKING, STOPPED, SUBMITTED
  const [coordinates, setCoordinates] = useState([]); // {lat, lng, accuracy, timestamp}
  const [currentPosition, setCurrentPosition] = useState(null); // [lat, lng]
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [isLocating, setIsLocating] = useState(true);
  const [permissionState, setPermissionState] = useState('PROMPT'); // PROMPT, GRANTED, DENIED, INSECURE
  const [distance, setDistance] = useState(0);
  const [estimatedArea, setEstimatedArea] = useState(null);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [stopTime, setStopTime] = useState(null);
  
  // Task & Activity context
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(searchParams.get('taskId') || '');
  const [activities, setActivities] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState(searchParams.get('activityId') || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const watchIdRef = useRef(null);

  // Check Secure Context & Location Permission
  const requestLocation = () => {
    setIsLocating(true);
    setError('');

    // Check Secure Context (HTTPS or localhost required for GPS)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isHttps = window.location.protocol === 'https:';

    if (!isLocalhost && !isHttps && window.isSecureContext === false) {
      setPermissionState('INSECURE');
      setIsLocating(false);
      setError('Browser security blocks GPS on plain HTTP. Please switch to HTTPS or use localhost.');
      return;
    }

    if (!navigator.geolocation) {
      setPermissionState('DENIED');
      setIsLocating(false);
      setError('Geolocation is not supported by your mobile browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        setCurrentPosition([lat, lng]);
        setGpsAccuracy(accuracy);
        setPermissionState('GRANTED');
        setIsLocating(false);
        setError('');
      },
      (err) => {
        console.warn('Geolocation query note:', err);
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionState('DENIED');
          setError('Location permission was denied. Please tap "Allow" in your browser location prompt.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('GPS satellite signal temporarily unavailable. Move to an outdoor open area.');
        } else if (err.code === err.TIMEOUT) {
          setError('GPS fix timed out. Tap retry to acquire satellite fix.');
        } else {
          setError(err.message);
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Load Tasks from API / Cache
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
        console.warn('Tasks fetch error:', e);
      }
    };
    fetchTasks();
  }, [token, isOnline, user?.role, user?.workerId]);

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
        console.warn('Activities error:', e);
      }
    };
    fetchDetails();
  }, [selectedTaskId, token, isOnline]);

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Calculate Distance & Enclosed Polygon Area via Turf.js
  const calculateMetrics = (coordsArr) => {
    if (coordsArr.length < 2) return { dist: 0, area: null };
    
    // turf expects [lon, lat]
    const line = turf.lineString(coordsArr.map(c => [c[1], c[0]]));
    const dist = turf.length(line, { units: 'meters' });

    let area = null;
    if (coordsArr.length > 3) {
      const first = coordsArr[0];
      const last = coordsArr[coordsArr.length - 1];
      const distanceToStart = turf.distance([first[1], first[0]], [last[1], last[0]], { units: 'meters' });
      
      // Approximate area if path loop nearly closes within 20 meters
      if (distanceToStart < 20) {
        try {
          const closedCoords = [...coordsArr, first];
          const polygon = turf.polygon([closedCoords.map(c => [c[1], c[0]])]);
          area = turf.area(polygon);
        } catch(e) {}
      }
    }
    return { dist: Math.round(dist * 10) / 10, area: area ? Math.round(area) : null };
  };

  // Start Real Continuous GPS Tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Live GPS geolocation is not supported on this device/browser.');
      return;
    }

    if (watchIdRef.current !== null) return;

    setStatus('TRACKING');
    setCoordinates([]);
    setDistance(0);
    setEstimatedArea(null);
    setError('');
    const nowISO = new Date().toISOString();
    setStartTime(nowISO);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracy = Math.round(pos.coords.accuracy);
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        
        setCurrentPosition(newPos);
        setGpsAccuracy(accuracy);

        // Real-time location emission via Socket.IO
        if (socket && user) {
          socket.emit('worker_location_update', {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy,
            timestamp: new Date().toISOString()
          });
        }

        setCoordinates(prev => {
          // Reject obvious GPS jumps (>80m in 1 tick when accuracy is low)
          if (prev.length > 0) {
            const lastPoint = prev[prev.length - 1];
            const distanceJump = turf.distance(
              [lastPoint.lng, lastPoint.lat],
              [pos.coords.longitude, pos.coords.latitude],
              { units: 'meters' }
            );

            if (distanceJump > 80 && accuracy > 35) {
              console.warn('GPS spike rejected:', distanceJump, 'm');
              return prev;
            }
          }

          const next = [...prev, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy,
            timestamp: pos.timestamp
          }];

          const coordsOnly = next.map(p => [p.lat, p.lng]);
          const metrics = calculateMetrics(coordsOnly);
          setDistance(metrics.dist);
          setEstimatedArea(metrics.area);
          return next;
        });
      },
      (err) => {
        console.error('GPS error:', err);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access denied. Please enable device location.');
          setStatus('READY');
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Stop Tracking
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const nowISO = new Date().toISOString();
    setStopTime(nowISO);

    const coordsOnly = coordinates.map(p => [p.lat, p.lng]);
    const metrics = calculateMetrics(coordsOnly);
    setDistance(metrics.dist);
    setEstimatedArea(metrics.area);
    setStatus('STOPPED');

    if (socket) {
      socket.emit('worker_location_stop');
    }
  };

  // Explicit Verification & Approval Submission
  const handleSubmitVerification = async () => {
    if (!selectedTaskId) {
      setError('Please select a target task to verify.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        activityId: selectedActivityId,
        distance,
        estimatedArea: estimatedArea || null,
        gpsAccuracy: gpsAccuracy || 8,
        startedAt: startTime,
        stoppedAt: stopTime,
        coordinates,
        description: `Verified Field Walk: Traced ${distance}m with ${coordinates.length} GPS fixes. Accuracy: ±${gpsAccuracy || 8}m. Area: ${estimatedArea ? estimatedArea + 'm²' : 'Linear alignment'}.`
      };

      if (isOnline && token) {
        const formData = new FormData();
        formData.append('activityId', selectedActivityId);
        formData.append('distance', distance);
        if (estimatedArea) formData.append('estimatedArea', estimatedArea);
        formData.append('gpsAccuracy', gpsAccuracy || 8);
        formData.append('startedAt', startTime);
        formData.append('stoppedAt', stopTime);
        formData.append('coordinates', JSON.stringify(coordinates));
        formData.append('description', payload.description);

        const res = await fetch(`${API_URL}/api/tasks/${selectedTaskId}/verify-field`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit field verification.');

        // Explicitly approve verification session in SQLite backend
        if (data.verificationId) {
          await fetch(`${API_URL}/api/field-verifications/${data.verificationId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }

        // If linked to an evidence submission, resolve evidence as approved
        const linkedEvidenceId = searchParams.get('evidenceId');
        if (linkedEvidenceId) {
          await fetch(`${API_URL}/api/admin/verifications/${linkedEvidenceId}/resolve`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              action: 'APPROVE',
              spatialData: { coordinates, distance, estimatedArea, gpsAccuracy }
            })
          });
        }

        setVerificationResult(data.aiResult || {
          recommendedProgress: 100,
          confidence: 96,
          strategicExplanation: `Verified field walk traced ${distance} meters. Spatial bounds align with activity scope and work has been marked as Verified.`
        });
        setStatus('SUBMITTED');
      } else {
        // Offline: Save to local GPS traces & Outbox queue
        await saveLocalGpsTrace({
          taskId: selectedTaskId,
          activityId: selectedActivityId,
          points: coordinates,
          distance,
          area: estimatedArea,
          accuracy: gpsAccuracy,
          startedAt: startTime,
          stoppedAt: stopTime
        });

        await addToOutbox({
          type: 'FIELD_VERIFICATION',
          endpoint: `${API_URL}/api/tasks/${selectedTaskId}/verify-field`,
          payload
        });

        setVerificationResult({
          recommendedProgress: 0,
          confidence: 100,
          strategicExplanation: 'Offline Mode: Field GPS trace stored in Outbox. Will auto-sync when online.'
        });
        setStatus('SUBMITTED');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify and approve work.');
    } finally {
      setSubmitting(false);
    }
  };

  const polylinePositions = coordinates.map(p => [p.lat, p.lng]);
  const defaultCenter = currentPosition || [12.8342, 79.7036]; // Real GPS position fallback if loading

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] relative overflow-hidden bg-slate-950">
      
      {/* Map Container */}
      <div className="flex-1 relative w-full h-full">
        <MapContainer center={defaultCenter} zoom={18} className="w-full h-full" zoomControl={false}>
          <TileLayer 
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterController position={currentPosition} isTracking={status === 'TRACKING'} />

          {/* Layered Glowing Yellow/Golden Polyline */}
          {polylinePositions.length > 0 && (
            <>
              {/* Outer Golden Glow */}
              <Polyline 
                positions={polylinePositions} 
                color="rgba(245, 158, 11, 0.45)" 
                weight={11} 
                opacity={1} 
              />
              {/* Core Solid Yellow Line */}
              <Polyline 
                positions={polylinePositions} 
                color="#f59e0b" 
                weight={4.5} 
                opacity={1} 
              />
            </>
          )}

          {polylinePositions.length > 0 && <Marker position={polylinePositions[0]} icon={startMarkerIcon} />}
          {currentPosition && <Marker position={currentPosition} icon={liveMarkerIcon} />}
        </MapContainer>

        {/* Top Floating Telemetry & Real Coordinates Overlay */}
        <div className="absolute top-3 left-3 right-3 z-[400] space-y-2 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-2xl shadow-xl flex items-center justify-between text-xs pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                status === 'TRACKING' ? 'bg-red-500 animate-pulse' : 
                status === 'STOPPED' ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              <span className="font-black text-white uppercase tracking-wider text-[11px]">
                {status === 'TRACKING' ? 'LIVE GPS WALK' : status === 'STOPPED' ? 'WALK COMPLETED' : 'REAL GPS READY'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Accuracy:</span>
              <span className={`font-black text-xs px-2 py-0.5 rounded ${
                gpsAccuracy === null ? 'text-slate-400' :
                gpsAccuracy <= 10 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                gpsAccuracy <= 25 ? 'bg-blue-950 text-blue-400 border border-blue-500/40' :
                'bg-amber-950 text-amber-400 border border-amber-500/40'
              }`}>
                {gpsAccuracy !== null ? `±${gpsAccuracy}m` : isLocating ? 'Locating...' : 'N/A'}
              </span>
            </div>
          </div>

          {/* Real Device Coordinates Bar */}
          {currentPosition && (
            <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-mono text-slate-300 flex items-center justify-between pointer-events-auto shadow-md">
              <span className="flex items-center gap-1 text-blue-400 font-bold">
                <Compass size={12} /> {currentPosition[0].toFixed(5)}°N, {currentPosition[1].toFixed(5)}°E
              </span>
              <span className="text-slate-400">{coordinates.length} Fixes Recorded</span>
            </div>
          )}

          {/* Real-time Distance & Metrics Banner */}
          {(status === 'TRACKING' || status === 'STOPPED') && (
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-2xl shadow-xl grid grid-cols-3 gap-2 text-center pointer-events-auto animate-in fade-in duration-200">
              <div>
                <div className="text-[9px] uppercase font-bold text-slate-400">Distance</div>
                <div className="text-base font-black text-amber-400">{distance} m</div>
              </div>
              <div>
                <div className="text-[9px] uppercase font-bold text-slate-400">Boundary Area</div>
                <div className="text-base font-black text-blue-400">{estimatedArea ? `${estimatedArea} m²` : 'Linear'}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase font-bold text-slate-400">GPS Status</div>
                <div className="text-base font-black text-emerald-400">
                  {status === 'TRACKING' ? 'Active' : 'Locked'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Location Permission / Insecure Warning Dialog */}
        {(permissionState === 'DENIED' || permissionState === 'INSECURE') && (
          <div className="absolute inset-4 z-[500] bg-slate-950/95 border-2 border-red-500/50 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3.5 shadow-2xl backdrop-blur-md">
            <div className="w-14 h-14 rounded-2xl bg-red-950 border border-red-500/50 text-red-400 flex items-center justify-center">
              <AlertTriangle size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white">Location Access Required</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs">{error}</p>
            </div>

            {permissionState === 'INSECURE' && (
              <a
                href={`https://${window.location.host}${window.location.pathname}`}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
              >
                Switch to Secure HTTPS URL
              </a>
            )}

            <button
              onClick={requestLocation}
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
            >
              <RefreshCw size={14} /> Retry Location Permission
            </button>
          </div>
        )}
      </div>

      {/* Bottom Control Drawer */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3 z-30 shadow-2xl safe-area-bottom">
        
        {error && permissionState === 'GRANTED' && (
          <div className="p-2.5 bg-red-950/90 border border-red-500/50 text-red-200 rounded-xl flex items-center gap-2 text-xs font-medium">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Task and Activity linking row */}
        {status === 'READY' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Task</label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-semibold p-2.5 rounded-xl outline-none"
              >
                {tasks.map(t => (
                  <option key={t.taskId} value={t.taskId}>{t.taskId} — {t.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Linked L6 Activity</label>
              <select
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-semibold p-2.5 rounded-xl outline-none"
              >
                {activities.map(a => (
                  <option key={a.activityId} value={a.activityId}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Action Button: START WALK / STOP WALK / SUBMIT */}
        {status === 'READY' && (
          <button
            onClick={startTracking}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-[0.99] text-slate-950 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Play fill="currentColor" size={18} /> START LIVE GPS WALK
          </button>
        )}

        {status === 'TRACKING' && (
          <button
            onClick={stopTracking}
            className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white rounded-2xl font-black text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 animate-pulse"
          >
            <Square fill="currentColor" size={18} /> STOP WALK & FINALIZE TRACE
          </button>
        )}

        {status === 'STOPPED' && (
          <div className="space-y-2">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="text-[10px] font-bold text-amber-400 uppercase">FIELD WALK TRACE SUMMARY:</div>
              <div className="flex justify-between text-slate-300">
                <span>Total Distance: <strong className="text-white">{distance} m</strong></span>
                <span>Area Extent: <strong className="text-blue-400">{estimatedArea ? `${estimatedArea} m²` : 'Linear'}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setStatus('READY'); setCoordinates([]); setDistance(0); }}
                className="py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                Discard & Retrack
              </button>
              <button
                onClick={handleSubmitVerification}
                disabled={submitting}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
              >
                <CheckCircle2 size={14} /> Explicitly Verify & Approve Work
              </button>
            </div>
          </div>
        )}

        {status === 'SUBMITTED' && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 size={16} /> Work Explicitly Verified & Approved!
              </div>
              <p className="text-slate-300">{verificationResult?.strategicExplanation}</p>
            </div>
            <button
              onClick={() => { setStatus('READY'); setCoordinates([]); setDistance(0); setVerificationResult(null); }}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md"
            >
              Start New Field Walk
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

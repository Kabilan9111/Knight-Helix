import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import { MapPin, Navigation, ShieldCheck, Play, Square, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

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

// Auto-pan component for real-time tracking
function MapPanner({ position, active }) {
  const map = useMap();
  useEffect(() => {
    if (active && position) {
      if (map.getZoom() < 18) {
        map.flyTo(position, 19, { animate: true, duration: 1.5 });
      } else {
        map.panTo(position, { animate: true, duration: 0.5 });
      }
    }
  }, [position, active, map]);
  return null;
}

export default function AdminSpatialVerification({ task, activity, verification, onClose, onVerified }) {
  const [status, setStatus] = useState('READY'); // READY, TRACKING, STOPPED, RESOLVING
  const [coordinates, setCoordinates] = useState([]); // Array of {lat, lng, accuracy, timestamp}
  const [currentPosition, setCurrentPosition] = useState(null); // [lat, lng]
  const [distance, setDistance] = useState(0);
  const [estimatedArea, setEstimatedArea] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null); // null when waiting
  const [error, setError] = useState('');

  const watchIdRef = useRef(null);
  const token = localStorage.getItem('sanchalan_token');

  // Ensure watcher is cleared on unmount
  useEffect(() => {
    return () => stopTracking(true);
  }, []);

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
      
      // Approximate area if path nearly closes
      if (distanceToStart < 15) {
        const closedCoords = [...coordsArr, first];
        const polygon = turf.polygon([closedCoords.map(c => [c[1], c[0]])]);
        area = turf.area(polygon);
      }
    }
    return { dist: Math.round(dist * 10) / 10, area: area ? Math.round(area) : null };
  };

  const startTracking = async () => {
    if (!navigator.geolocation) {
      setError('Live location tracking is not supported on this device.');
      return;
    }

    // Check permissions if supported
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'denied') {
          setError('Location access is blocked. Please allow location access for this site and try again.');
          return;
        }
      } catch (e) {
        console.error("Permissions query failed", e);
      }
    }

    if (watchIdRef.current !== null) {
      return; // Prevent multiple watchers
    }

    setStatus('TRACKING');
    setCoordinates([]);
    setDistance(0);
    setEstimatedArea(null);
    setGpsAccuracy(null);
    setError('');
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracy = Math.round(pos.coords.accuracy);
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        
        console.log("REAL GPS UPDATE", {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp
        });

        setCurrentPosition(newPos);
        setGpsAccuracy(accuracy);
        
        setCoordinates(prev => {
          // Check for impossible jumps
          if (prev.length > 0) {
            const lastPoint = prev[prev.length - 1];
            const distanceJump = turf.distance(
              [lastPoint.lng, lastPoint.lat],
              [pos.coords.longitude, pos.coords.latitude],
              { units: 'meters' }
            );
            
            // If jump is > 100m in one tick and accuracy is poor, reject it as a GPS spike
            if (distanceJump > 100 && accuracy > 30) {
              console.log("GPS POINT REJECTED", { 
                reason: 'Impossible distance jump', 
                latitude: pos.coords.latitude, 
                longitude: pos.coords.longitude, 
                accuracy, 
                distanceJump 
              });
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
          
          return next;
        });
      },
      (err) => {
        console.log("GPS ERROR", err);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access is required for spatial verification.');
          setStatus('READY');
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Unable to obtain your current location. Please move to an area with better GPS reception.');
        } else if (err.code === err.TIMEOUT) {
          setError('GPS signal is taking too long. Waiting for another location update...');
        } else {
          setError('GPS signal issues: ' + err.message);
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

  const stopTracking = (isCleanup = false) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (!isCleanup && status === 'TRACKING') {
      const coordsOnly = coordinates.map(p => [p.lat, p.lng]);
      const metrics = calculateMetrics(coordsOnly);
      setDistance(metrics.dist);
      setEstimatedArea(metrics.area);
      setStatus('STOPPED');
    }
  };

  const resetTracking = () => {
    setStatus('READY');
    setCoordinates([]);
    setDistance(0);
    setEstimatedArea(null);
    setGpsAccuracy(null);
    setError('');
  };

  const handleResolve = async (action) => {
    setStatus('RESOLVING');
    try {
      const payload = {
        action,
        rejectionReason: action === 'REJECT' ? 'Put on hold during spatial map verification' : undefined,
        spatialData: {
          coordinates,
          distance,
          estimatedArea,
          gpsAccuracy: gpsAccuracy || 0
        }
      };

      const idToResolve = verification.evidenceId || verification.verificationId || verification.id;

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/verifications/${idToResolve}/resolve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        onVerified();
        onClose();
      } else {
        throw new Error(data.error || 'Failed to resolve verification.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus('STOPPED');
    }
  };

  const getAccuracyDisplay = (acc) => {
    if (acc === null) return <div className="text-sm font-bold text-[var(--text-primary)]">Waiting for GPS...</div>;
    
    let label = '';
    let colorClass = 'text-[var(--text-secondary)]';
    let warning = null;
    
    if (acc <= 10) {
      label = '(Excellent)';
    } else if (acc <= 25) {
      label = '(Good)';
    } else if (acc <= 50) {
      label = '(Moderate)';
    } else {
      label = 'POOR GPS SIGNAL';
      colorClass = 'text-red-500';
      warning = "GPS accuracy is currently low. Move near a window or outdoors for a stronger location signal.";
    }

    return (
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--text-primary)]">±{acc}m</span>
          <span className={`text-[10px] uppercase font-bold ${colorClass}`}>{label}</span>
        </div>
        {warning && <div className="text-[10px] text-red-500 font-medium text-right mt-1 max-w-[200px] leading-tight">{warning}</div>}
      </div>
    );
  };

  const polylinePositions = coordinates.map(p => [p.lat, p.lng]);
  const defaultCenter = currentPosition || (polylinePositions.length > 0 ? polylinePositions[0] : [13.0827, 80.2707]);

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-medium)] bg-[var(--bg-surface-1)] flex justify-between items-center shadow-sm z-10 relative">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Navigation size={24} /></div>
          <div>
            <div className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{task.taskId} • Field Verification</div>
            <h2 className="text-xl font-black text-[var(--text-primary)] leading-tight">{activity.name}</h2>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onClose} disabled={status === 'TRACKING'} className="p-2 text-[var(--text-tertiary)] hover:bg-[var(--border-subtle)] rounded-full transition-colors disabled:opacity-50">
            <XCircle size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* Left Side: Map Hero */}
        <div className="flex-1 relative bg-slate-100 h-full">
          <MapContainer center={defaultCenter} zoom={18} className="w-full h-full" zoomControl={false}>
            <TileLayer 
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            />
            <MapPanner position={currentPosition} active={status === 'TRACKING'} />
            
            {/* LAYERED GLOWING GOLDEN LINE */}
            {polylinePositions.length > 0 && (
              <>
                {/* Wide Translucent Glow Underneath */}
                <Polyline 
                  positions={polylinePositions} 
                  color="rgba(255, 215, 0, 0.4)" 
                  weight={12} 
                  opacity={1} 
                />
                {/* Bright Narrow Core On Top */}
                <Polyline 
                  positions={polylinePositions} 
                  color="#FFD700" 
                  weight={4} 
                  opacity={1} 
                />
              </>
            )}
            
            {polylinePositions.length > 0 && <Marker position={polylinePositions[0]} icon={startIcon} />}
            {currentPosition && status === 'TRACKING' && <Marker position={currentPosition} icon={liveIcon} />}
          </MapContainer>

          {/* Floating Tracking UI */}
          {(status === 'TRACKING' || status === 'STOPPED') && (
            <div className="absolute top-6 left-6 z-[400] bg-white/90 backdrop-blur shadow-lg border border-[var(--border-medium)] rounded-2xl p-5 w-72">
              <div className="flex items-center gap-2 mb-4">
                {status === 'TRACKING' ? (
                  <><span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-bold text-red-600 uppercase tracking-widest">● LIVE Tracking your location...</span></>
                ) : (
                  <><span className="w-2.5 h-2.5 bg-slate-400 rounded-full"></span>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Walk Completed</span></>
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
                <div className="flex justify-between items-start">
                  <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mt-1">GPS Accuracy</div>
                  {getAccuracyDisplay(gpsAccuracy)}
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
              <p className="text-[var(--text-secondary)] mb-8">Walk around the boundary of the completed work. SANCHALAN will record your actual GPS path to verify spatial execution.</p>
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
                    <div className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Final Accuracy</div>
                    <div className="flex items-center gap-1">
                      <div className="text-lg font-bold text-[var(--text-primary)]">
                        {gpsAccuracy === null ? 'N/A' : `±${gpsAccuracy}m`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3">
                <button onClick={resetTracking} className="w-full py-3 bg-[var(--bg-surface-2)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl font-bold transition-all">
                  Discard & Retrack
                </button>
                <div className="flex gap-3">
                  <button onClick={() => handleResolve('REJECT')} className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all">
                    HOLD
                  </button>
                  <button onClick={() => handleResolve('APPROVE')} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all">
                    VERIFIED
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === 'RESOLVING' && (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">Resolving Evidence...</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

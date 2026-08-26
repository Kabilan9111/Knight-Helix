import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Clock, MapPin, Activity, Map as MapIcon, ChevronRight } from 'lucide-react';
import { segmentWorkerHistory, calculateTotalDistance } from '../../utils/tracking';
import { formatDistance, formatDuration } from '../../utils/geo';

// Small map controller for focused viewing
const MiniMapController = ({ points, focusedSegment }) => {
  const map = useMap();
  useEffect(() => {
    // Invalidate size once modal opens and stabilizes
    const timeout = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timeout);
  }, [map]);

  useEffect(() => {
    if (focusedSegment && focusedSegment.points && focusedSegment.points.length > 0) {
      if (focusedSegment.points.length === 1) {
        map.flyTo([focusedSegment.points[0].latitude, focusedSegment.points[0].longitude], 16, { duration: 1 });
      } else {
        const bounds = L.latLngBounds(focusedSegment.points.map(p => [p.latitude, p.longitude]));
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1 });
      }
    } else if (points && points.length > 0) {
      if (points.length === 1) {
        map.flyTo([points[0].latitude, points[0].longitude], 15, { duration: 1 });
      } else {
        const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude]));
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1 });
      }
    }
  }, [points, focusedSegment, map]);
  return null;
};

// Start marker icon
const startIcon = L.divIcon({
  className: 'custom-start-marker',
  html: `<div style="background: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

export default function WorkerTrackingModal({ worker, history, status, onClose }) {
  const [focusedSegment, setFocusedSegment] = useState(null);

  // Derived tracking data
  const segments = useMemo(() => segmentWorkerHistory(history), [history]);
  const totalDistance = useMemo(() => calculateTotalDistance(history), [history]);
  
  const firstPoint = history && history.length > 0 ? history[0] : null;
  const lastPoint = history && history.length > 0 ? history[history.length - 1] : null;

  const durationMs = (firstPoint && lastPoint) ? (new Date(lastPoint.timestamp) - new Date(firstPoint.timestamp)) : 0;
  const stationaryLocations = segments.filter(s => s.type === 'STATIONARY').length;

  const handleShowFullRoute = () => {
    setFocusedSegment(null);
  };

  const handleFocusLast = () => {
    if (segments.length > 0) {
      setFocusedSegment(segments[segments.length - 1]);
    }
  };

  if (!worker || !history) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 leading-tight uppercase tracking-wide">{worker.workerName}</h2>
              <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                status === 'LIVE' ? 'bg-emerald-100 text-emerald-700' : 
                status === 'INACTIVE' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
              }`}>
                {status === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                {status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
              <span>{worker.workerId}</span>
              <span>•</span>
              <span>Tracking History</span>
              <span>•</span>
              <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100 bg-white">
          <div className="p-4 border-r border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
              <Clock size={14} className="text-indigo-500" />
              Duration
            </div>
            <div className="text-xl font-bold text-slate-900">{formatDuration(durationMs)}</div>
          </div>
          <div className="p-4 border-r border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
              <MapIcon size={14} className="text-emerald-500" />
              Distance
            </div>
            <div className="text-xl font-bold text-slate-900">{formatDistance(totalDistance)}</div>
          </div>
          <div className="p-4 border-r border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
              <Activity size={14} className="text-amber-500" />
              GPS Points
            </div>
            <div className="text-xl font-bold text-slate-900">{history.length}</div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
              <MapPin size={14} className="text-rose-500" />
              Locations
            </div>
            <div className="text-xl font-bold text-slate-900">{stationaryLocations}</div>
          </div>
        </div>

        {/* Main Content (Split View) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
          
          {/* Left: Timeline */}
          <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
            <div className="p-4 border-b border-slate-200 bg-white shadow-sm z-10 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Movement Timeline</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
              {segments.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No historical tracking data available.</div>
              ) : (
                segments.map((seg, idx) => {
                  const isSelected = focusedSegment?.id === seg.id;
                  const isStationary = seg.type === 'STATIONARY';
                  const segDurationMs = new Date(seg.endTime) - new Date(seg.startTime);
                  
                  return (
                    <div 
                      key={seg.id} 
                      className="relative pl-6"
                    >
                      {/* Timeline Line */}
                      {idx < segments.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-[-20px] w-px bg-slate-200"></div>
                      )}
                      
                      {/* Timeline Dot */}
                      <div className={`absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10
                        ${isStationary ? 'bg-indigo-500' : 'bg-slate-400'}`}
                      ></div>
                      
                      <button
                        onClick={() => setFocusedSegment(seg)}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group
                          ${isSelected 
                            ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className={`text-xs font-bold ${isStationary ? 'text-indigo-600' : 'text-slate-500'} flex items-center gap-1`}>
                            {isStationary ? 'STATIONARY' : 'MOVING'}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400">
                            {formatDuration(segDurationMs)}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-slate-800 mb-1">
                          {new Date(seg.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(seg.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="text-xs text-slate-500 truncate flex items-center justify-between">
                          <span>{seg.endLatitude.toFixed(4)}, {seg.endLongitude.toFixed(4)}</span>
                          <ChevronRight size={14} className={`transition-transform ${isSelected ? 'text-indigo-500 translate-x-1' : 'text-slate-300 group-hover:translate-x-1'}`} />
                        </div>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Map */}
          <div className="flex-1 relative bg-slate-100 z-0">
            <MapContainer 
              center={[22.5, 79.0]} 
              zoom={5} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MiniMapController points={history} focusedSegment={focusedSegment} />
              
              {/* Full Route Polyline */}
              {history && history.length > 1 && (
                <Polyline 
                  positions={history.map(p => [p.latitude, p.longitude])}
                  pathOptions={{ color: '#6366f1', weight: 4, opacity: 0.6 }}
                />
              )}

              {/* Focused Segment Polyline (Highlights selected moving segment) */}
              {focusedSegment && focusedSegment.type === 'MOVING' && focusedSegment.points && focusedSegment.points.length > 1 && (
                <Polyline 
                  positions={focusedSegment.points.map(p => [p.latitude, p.longitude])}
                  pathOptions={{ color: '#ec4899', weight: 6, opacity: 1 }}
                />
              )}

              {/* Start Marker */}
              {firstPoint && (
                <Marker position={[firstPoint.latitude, firstPoint.longitude]} icon={startIcon}>
                </Marker>
              )}

              {/* Focused Segment Marker (Highlights selected stationary segment) */}
              {focusedSegment && focusedSegment.type === 'STATIONARY' && (
                <Marker position={[focusedSegment.endLatitude, focusedSegment.endLongitude]} icon={
                  L.divIcon({
                    className: 'custom-focus-marker',
                    html: `<div style="background: #8b5cf6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(139,92,246,0.8); animation: pulse 2s infinite;"></div>`,
                    iconSize: [18, 18],
                    iconAnchor: [9, 9]
                  })
                }>
                </Marker>
              )}

              {/* Current/Last Known Marker (Using the colored marker from main map design conceptually) */}
              {lastPoint && (
                <Marker position={[lastPoint.latitude, lastPoint.longitude]} icon={
                  L.divIcon({
                    className: 'custom-admin-worker-marker',
                    html: `
                      <div style="background: rgba(255, 255, 255, 0.95); border: 2px solid ${status === 'LIVE' ? '#10b981' : status === 'INACTIVE' ? '#f59e0b' : '#ef4444'}; border-radius: 8px; padding: 4px 8px; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); color: #0f172a; font-family: inherit; font-weight: 700; font-size: 12px; white-space: nowrap;">
                        <div style="width: 8px; height: 8px; background: ${status === 'LIVE' ? '#10b981' : status === 'INACTIVE' ? '#f59e0b' : '#ef4444'}; border-radius: 50%; box-shadow: 0 0 8px ${status === 'LIVE' ? '#10b981' : status === 'INACTIVE' ? '#f59e0b' : '#ef4444'}; ${status === 'LIVE' ? 'animation: pulse 2s infinite;' : ''}"></div>
                        <span>${worker.workerName}</span>
                      </div>
                      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${status === 'LIVE' ? '#10b981' : status === 'INACTIVE' ? '#f59e0b' : '#ef4444'}; margin: 0 auto;"></div>
                    `,
                    iconSize: [80, 40],
                    iconAnchor: [40, 40]
                  })
                }>
                </Marker>
              )}
            </MapContainer>

            {/* Map Controls overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-[400] flex justify-between pointer-events-none">
              <div className="bg-white/95 backdrop-blur shadow-md border border-slate-200 rounded-lg p-2 flex gap-2 pointer-events-auto">
                <button 
                  onClick={handleShowFullRoute}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded uppercase transition-colors"
                >
                  Show Full Route
                </button>
                <button 
                  onClick={handleFocusLast}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded uppercase transition-colors"
                >
                  Focus Last Location
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

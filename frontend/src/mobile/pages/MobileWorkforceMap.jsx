import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMobileAuth } from '../context/MobileAuthContext';
import { useSocket } from '../../context/SocketContext';
import { Users, HardHat, Phone, MapPin, Clock, RefreshCw, Layers, ShieldCheck, ChevronUp, ChevronDown } from 'lucide-react';

import { API_URL } from '../config';

const workerLiveIcon = new L.DivIcon({
  className: 'mobile-worker-live-icon',
  html: `<div style="width:20px;height:20px;background:#10b981;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(16,185,129,0.8); animation: pulse 2s infinite;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const workerOfflineIcon = new L.DivIcon({
  className: 'mobile-worker-offline-icon',
  html: `<div style="width:16px;height:16px;background:#64748b;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

function MapPanner({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.panTo(center, { animate: true, duration: 0.5 });
  }, [center, map]);
  return null;
}

export default function MobileWorkforceMap() {
  const { token, isOnline } = useMobileAuth();
  const socket = useSocket();

  const [locations, setLocations] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workerHistory, setWorkerHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      if (!token) return;
      const res = await fetch(`${API_URL}/api/admin/locations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
        if (data.length > 0 && !selectedWorker) {
          setSelectedWorker(data[0]);
          loadHistory(data[0].workerId);
        }
      }
    } catch (e) {
      console.warn('Locations fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (workerId) => {
    try {
      if (!token) return;
      const res = await fetch(`${API_URL}/api/admin/locations/${workerId}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkerHistory(data.points || []);
      }
    } catch (e) {
      console.warn('History load error:', e);
    }
  };

  useEffect(() => {
    fetchLocations();
    if (socket) {
      socket.on('worker_location_updated', (loc) => {
        setLocations(prev => {
          const index = prev.findIndex(w => w.workerId === loc.workerId);
          if (index >= 0) {
            const next = [...prev];
            next[index] = loc;
            return next;
          }
          return [...prev, loc];
        });
        if (selectedWorker?.workerId === loc.workerId) {
          setWorkerHistory(prev => [...prev, loc]);
        }
      });

      socket.on('worker_location_stopped', ({ workerId }) => {
        setLocations(prev => prev.map(w => w.workerId === workerId ? { ...w, status: 'OFFLINE' } : w));
      });

      return () => {
        socket.off('worker_location_updated');
        socket.off('worker_location_stopped');
      };
    }
  }, [token, selectedWorker]);

  const historyPositions = workerHistory.map(p => [p.latitude, p.longitude]);
  const defaultCenter = selectedWorker && selectedWorker.latitude ? [selectedWorker.latitude, selectedWorker.longitude] : [13.0827, 80.2707];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] relative overflow-hidden bg-slate-950">
      
      {/* Map View */}
      <div className="flex-1 relative w-full h-full">
        <MapContainer center={defaultCenter} zoom={16} className="w-full h-full" zoomControl={false}>
          <TileLayer 
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapPanner center={selectedWorker && selectedWorker.latitude ? [selectedWorker.latitude, selectedWorker.longitude] : null} />

          {/* Historical Breadcrumb Polyline */}
          {historyPositions.length > 1 && (
            <Polyline 
              positions={historyPositions}
              color="#3b82f6"
              weight={4}
              opacity={0.8}
              dashArray="6, 8"
            />
          )}

          {/* Worker Markers */}
          {locations.map(worker => {
            if (!worker.latitude || !worker.longitude) return null;
            const isSelected = selectedWorker?.workerId === worker.workerId;
            const icon = worker.status === 'LIVE' ? workerLiveIcon : workerOfflineIcon;

            return (
              <Marker
                key={worker.workerId}
                position={[worker.latitude, worker.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    setSelectedWorker(worker);
                    loadHistory(worker.workerId);
                  }
                }}
              />
            );
          })}
        </MapContainer>

        {/* Top Floating Workforce Pill */}
        <div className="absolute top-3 left-3 right-3 z-[400] flex justify-between items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-2xl shadow-xl text-xs">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-400" />
            <span className="font-black text-white uppercase text-[11px]">
              Live Site Workforce ({locations.length})
            </span>
          </div>
          <button 
            onClick={fetchLocations}
            className="text-blue-400 hover:text-white p-1"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Bottom Worker Bottom Sheet */}
      {selectedWorker && (
        <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3 z-30 shadow-2xl safe-area-bottom">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                selectedWorker.status === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                <HardHat size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white leading-tight">
                  {selectedWorker.workerName || selectedWorker.name || selectedWorker.workerId}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  ID: {selectedWorker.workerId} • {selectedWorker.status === 'LIVE' ? '🟢 LIVE ON SITE' : '⚫ OFFLINE'}
                </p>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
              selectedWorker.status === 'LIVE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              {selectedWorker.status || 'ACTIVE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
            <div className="bg-slate-950 p-2 rounded-xl">
              <span className="text-[9px] uppercase font-bold text-slate-400">GPS Accuracy</span>
              <div className="font-bold text-white mt-0.5">
                {selectedWorker.accuracy ? `±${Math.round(selectedWorker.accuracy)}m` : 'N/A'}
              </div>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl">
              <span className="text-[9px] uppercase font-bold text-slate-400">Breadcrumbs</span>
              <div className="font-bold text-blue-400 mt-0.5">
                {workerHistory.length} Trace Points
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

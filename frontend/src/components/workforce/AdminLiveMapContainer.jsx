import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';

const MapController = ({ lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    // Invalidate size in case layout changes
    const timeout = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timeout);
  }, [map]);

  useEffect(() => {
    if (lat && lon) {
      map.flyTo([lat, lon], 14, { duration: 1.5 });
    }
  }, [lat, lon, map]);
  return null;
};

// Compute status based on timestamps
export const getWorkerStatus = (timestamp) => {
  if (!timestamp) return 'OFFLINE';
  const diffSeconds = (new Date() - new Date(timestamp)) / 1000;
  if (diffSeconds <= 30) return 'LIVE';
  if (diffSeconds <= 120) return 'INACTIVE';
  return 'OFFLINE';
};

const createAdminWorkerMarker = (workerName, status) => {
  const color = status === 'LIVE' ? '#10b981' : status === 'INACTIVE' ? '#f59e0b' : '#ef4444';
  const anim = status === 'LIVE' ? 'animation: pulse 2s infinite;' : '';

  return L.divIcon({
    className: 'custom-admin-worker-marker',
    html: `
      <div style="
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid ${color};
        border-radius: 8px;
        padding: 4px 8px;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        color: #0f172a;
        font-family: inherit;
        font-weight: 700;
        font-size: 12px;
        white-space: nowrap;
      ">
        <div style="width: 8px; height: 8px; background: ${color}; border-radius: 50%; box-shadow: 0 0 8px ${color}; ${anim}"></div>
        <span>${workerName}</span>
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid ${color};
        margin: 0 auto;
      "></div>
    `,
    iconSize: [80, 40],
    iconAnchor: [40, 40],
    popupAnchor: [0, -40]
  });
};

export default function AdminLiveMapContainer({ workers, focusedWorkerId, workerHistory }) {
  const defaultCenter = [22.5, 79.0]; // India

  const focusedWorker = useMemo(() => 
    workers.find(w => w.workerId === focusedWorkerId), 
  [workers, focusedWorkerId]);

  const focusedHistory = useMemo(() => {
    if (!focusedWorkerId || !workerHistory || !workerHistory[focusedWorkerId]) return [];
    return workerHistory[focusedWorkerId].map(pt => [pt.latitude, pt.longitude]);
  }, [focusedWorkerId, workerHistory]);

  return (
    <div className="w-full h-full relative z-0 rounded-xl overflow-hidden border border-[var(--border-medium)] shadow-sm flex flex-col">
      <div className="flex-1 relative">
        <MapContainer 
          center={defaultCenter} 
          zoom={5} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController 
            lat={focusedWorker?.latitude} 
            lon={focusedWorker?.longitude} 
          />

          {focusedHistory.length > 1 && (
            <Polyline 
              positions={focusedHistory}
              pathOptions={{ color: '#6366f1', weight: 4, opacity: 0.8, dashArray: '5, 10' }}
            />
          )}
          
          {workers.filter(w => w.latitude && w.longitude).map((worker) => {
            const status = getWorkerStatus(worker.timestamp);
            return (
              <Marker 
                key={worker.workerId} 
                position={[worker.latitude, worker.longitude]} 
                icon={createAdminWorkerMarker(worker.workerName, status)}
              >
                <Tooltip direction="top" offset={[0, -40]} opacity={1}>
                  <div className="text-center font-bold">
                    <div>{worker.workerName}</div>
                    <div className="text-[10px] text-gray-500">{worker.workerId}</div>
                    <div className={`text-[10px] ${status === 'LIVE' ? 'text-emerald-600' : status === 'INACTIVE' ? 'text-amber-600' : 'text-red-600'}`}>● {status}</div>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2 border-b pb-2">
                      <div className="w-10 h-10 bg-indigo-100 rounded flex items-center justify-center text-indigo-700 font-bold text-lg">
                        {worker.workerName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 m-0 leading-tight">{worker.workerName}</h3>
                        <p className="text-xs text-gray-500 m-0">{worker.workerId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${status === 'LIVE' ? 'bg-emerald-100 text-emerald-700' : status === 'INACTIVE' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'LIVE' ? 'bg-emerald-500 animate-pulse' : status === 'INACTIVE' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                        {status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-500">Lat:</span> 
                        <span>{worker.latitude.toFixed(5)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-500">Lon:</span> 
                        <span>{worker.longitude.toFixed(5)}</span>
                      </div>
                      {worker.accuracy && (
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-500">Accuracy:</span> 
                          <span>±{Math.round(worker.accuracy)}m</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-right text-[10px] text-gray-400">
                      Last seen: {Math.floor((new Date() - new Date(worker.timestamp)) / 1000)} seconds ago
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        
        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur rounded-lg shadow-lg border border-gray-200 p-3 text-xs font-medium text-gray-700 pointer-events-none">
          <div className="font-bold text-gray-900 mb-2 border-b pb-1">Map Legend</div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]"></span>
            <span>LIVE (Active)</span>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_4px_#f59e0b]"></span>
            <span>INACTIVE (No recent update)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444]"></span>
            <span>OFFLINE (Last known)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

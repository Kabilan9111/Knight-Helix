import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
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
const getWorkerStatus = (timestamp) => {
  if (!timestamp) return 'OFFLINE';
  const diffSeconds = (new Date() - new Date(timestamp)) / 1000;
  if (diffSeconds < 30) return 'LIVE';
  if (diffSeconds < 120) return 'STALE';
  return 'OFFLINE';
};

const createAdminWorkerMarker = (workerName, status) => {
  const color = status === 'LIVE' ? '#10b981' : status === 'STALE' ? '#f59e0b' : '#64748b';
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

export default function AdminLiveMapContainer({ workers, focusedWorkerId }) {
  const defaultCenter = [22.5, 79.0]; // India

  const focusedWorker = useMemo(() => 
    workers.find(w => w.workerId === focusedWorkerId), 
  [workers, focusedWorkerId]);

  return (
    <div className="w-full h-full relative z-0 rounded-xl overflow-hidden border border-[var(--border-medium)] shadow-sm">
      <MapContainer 
        center={defaultCenter} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController 
          lat={focusedWorker?.latitude} 
          lon={focusedWorker?.longitude} 
        />
        
        {workers.filter(w => w.status !== 'OFFLINE' && getWorkerStatus(w.timestamp) !== 'OFFLINE').map((worker) => {
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
                  <div className={`text-[10px] ${status === 'LIVE' ? 'text-emerald-600' : 'text-amber-600'}`}>● {status}</div>
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
                    <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${status === 'LIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status === 'LIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
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
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-500">Accuracy:</span> 
                      <span>{Math.round(worker.accuracy)}m</span>
                    </div>
                  </div>
                  <div className="mt-3 text-right text-[10px] text-gray-400">
                    Last update: {Math.floor((new Date() - new Date(worker.timestamp)) / 1000)} seconds ago
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

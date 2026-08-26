import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const MapController = ({ lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.flyTo([lat, lon], 14, { duration: 1.5 });
    }
  }, [lat, lon, map]);
  return null;
};

const createWorkerMarker = (workerName) => {
  return L.divIcon({
    className: 'custom-worker-marker',
    html: `
      <div style="
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #10b981;
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
        <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; animation: pulse 2s infinite;"></div>
        <span>${workerName || 'You'}</span>
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid #10b981;
        margin: 0 auto;
      "></div>
    `,
    iconSize: [80, 40],
    iconAnchor: [40, 40],
    popupAnchor: [0, -40]
  });
};

export default function WorkerLiveMap() {
  const [location, setLocation] = useState(null);
  const [workerName, setWorkerName] = useState('');

  const fetchMyPosition = async () => {
    try {
      const token = localStorage.getItem('sanchalan_token');
      const res = await fetch('http://localhost:3001/api/location/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.latitude) {
          setLocation({ lat: data.latitude, lon: data.longitude, accuracy: data.accuracy });
          setWorkerName(data.workerName);
        } else {
          setLocation(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch own location', err);
    }
  };

  useEffect(() => {
    fetchMyPosition();
    const interval = setInterval(fetchMyPosition, 5000); // Polling every 5 seconds to sync with backend changes
    return () => clearInterval(interval);
  }, []);

  if (!location) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-[var(--bg-surface-1)] border border-[var(--border-medium)] rounded-xl border-dashed">
        <div className="text-[var(--text-tertiary)] mb-2">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">Location sharing is currently inactive</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] md:h-full relative z-0 rounded-xl overflow-hidden border border-emerald-200 shadow-sm">
      <MapContainer 
        center={[location.lat, location.lon]} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapController lat={location.lat} lon={location.lon} />
        
        <Marker position={[location.lat, location.lon]} icon={createWorkerMarker(workerName)}>
          <Popup>
            <div className="text-center p-1">
              <strong>{workerName || 'You'}</strong><br/>
              <span className="text-xs text-gray-500">Accuracy: {Math.round(location.accuracy)}m</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

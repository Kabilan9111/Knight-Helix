import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to handle dynamic map resizing and focusing
const MapController = ({ selectedCityCoordinates }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate size in case sidebar or layout changes
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timeout);
  }, [map]);

  useEffect(() => {
    if (selectedCityCoordinates) {
      map.flyTo([selectedCityCoordinates.lat, selectedCityCoordinates.lon], 10, {
        duration: 1.5
      });
    }
  }, [selectedCityCoordinates, map]);

  return null;
};

// Helper for rendering custom DivIcon
const createCustomMarker = (weather) => {
  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}.png`;
  
  return L.divIcon({
    className: 'custom-weather-marker',
    html: `
      <div style="
        background: rgba(8, 11, 18, 0.9);
        border: 1px solid rgba(124, 58, 237, 0.4);
        border-radius: 8px;
        padding: 4px 8px;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        color: white;
        font-family: inherit;
        font-weight: 600;
        font-size: 12px;
        white-space: nowrap;
        backdrop-filter: blur(4px);
      ">
        <img src="${iconUrl}" alt="${weather.condition}" style="width: 24px; height: 24px; filter: drop-shadow(0 0 2px rgba(255,255,255,0.3)); margin: -4px 0;" />
        <span>${weather.temperatureC}°</span>
      </div>
      <div style="
        width: 8px;
        height: 8px;
        background: #7c3aed;
        border-radius: 50%;
        margin: 4px auto 0;
        box-shadow: 0 0 8px #7c3aed;
      "></div>
    `,
    iconSize: [60, 45],
    iconAnchor: [30, 45],
    popupAnchor: [0, -45]
  });
};

export default function WeatherMapContainer({ weatherData, selectedCity, onSelectCity }) {
  const center = [22.5, 79.0]; // Initial center around India
  const zoom = 5;

  const selectedCoordinates = selectedCity 
    ? weatherData.find(w => w.city === selectedCity)?.coordinates 
    : null;

  return (
    <div className="w-full h-full relative z-0 rounded-xl overflow-hidden border border-[var(--border-medium)]">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController selectedCityCoordinates={selectedCoordinates} />
        
        {weatherData.map((weather) => (
          <Marker 
            key={weather.city} 
            position={[weather.coordinates.lat, weather.coordinates.lon]}
            icon={createCustomMarker(weather)}
            eventHandlers={{
              click: () => onSelectCity(weather.city)
            }}
          >
            <Popup className="premium-weather-popup">
              <div style={{ padding: '4px', minWidth: '180px', fontFamily: 'inherit', color: '#1e293b' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', color: '#0f172a' }}>
                  {weather.city.toUpperCase()}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt={weather.condition} style={{ width: '48px', height: '48px', background: '#f8fafc', borderRadius: '8px' }} />
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1' }}>{weather.temperatureC}°C</div>
                    <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>{weather.description}</div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#475569' }}>
                  <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ fontWeight: '600' }}>Feels Like</div>
                    <div>{weather.feelsLikeC}°C</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ fontWeight: '600' }}>Humidity</div>
                    <div>{weather.humidity}%</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ fontWeight: '600' }}>Wind</div>
                    <div>{weather.windKmh} km/h</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ fontWeight: '600' }}>Updated</div>
                    <div>{new Date(weather.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Global overrides for leaflet popups to match premium look */}
      <style>{`
        .premium-weather-popup .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .premium-weather-popup .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }
        .premium-weather-popup a.leaflet-popup-close-button {
          color: #64748b;
          padding: 8px;
        }
        .premium-weather-popup a.leaflet-popup-close-button:hover {
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}

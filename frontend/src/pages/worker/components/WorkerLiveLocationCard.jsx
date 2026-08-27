import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, NavigationOff, AlertCircle } from 'lucide-react';
import { useSocket } from '../../../context/SocketContext';

export default function WorkerLiveLocationCard() {
  const socket = useSocket();
  const [status, setStatus] = useState('LOCATION_NOT_REQUESTED');
  const [location, setLocation] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    // Check initial permission (won't prompt, just checks status if supported)
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'denied') setStatus('LOCATION_DENIED');
        // If granted, we still wait for user to hit "Enable Location" to start tracking
      });
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  const sendLocationUpdate = (position) => {
    try {
      const payload = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      };
      
      if (socket) {
        socket.emit('worker_location_update', payload);
        setLocation(payload);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Failed to send location update', err);
    }
  };

  const handleEnableLocation = () => {
    if (!navigator.geolocation) {
      setStatus('LOCATION_UNAVAILABLE');
      return;
    }
    
    setStatus('LOCATION_REQUESTED');

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setStatus('LIVE');
        sendLocationUpdate(position);
      },
      (error) => {
        console.error(error);
        if (error.code === 1) setStatus('LOCATION_DENIED');
        else setStatus('LOCATION_ERROR');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
    setWatchId(id);
  };

  const handleStopSharing = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    setStatus('LOCATION_NOT_REQUESTED');
    setLocation(null);

    if (socket) {
      socket.emit('worker_location_stop');
    }
  };

  // UI Render states
  if (status === 'LOCATION_REQUESTED') {
    return (
      <div className="bg-white rounded-xl border border-[var(--border-medium)] p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4"></div>
          <h3 className="font-bold text-[var(--text-primary)] mb-1">Requesting Access</h3>
          <p className="text-sm text-[var(--text-secondary)]">Please allow location access in your browser.</p>
        </div>
      </div>
    );
  }

  if (status === 'LOCATION_DENIED') {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={20} /></div>
          <h3 className="font-bold text-red-800">Location Access Blocked</h3>
        </div>
        <p className="text-sm text-red-700 mb-6">Browser location permission is disabled. Please enable location access in your browser settings and try again.</p>
        <button onClick={handleEnableLocation} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  if (status === 'LIVE') {
    return (
      <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg relative">
              <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
              <Navigation size={20} />
            </div>
            <div>
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                LIVE
              </h3>
              <p className="text-[11px] text-emerald-600 uppercase tracking-wide">Location Sharing Active</p>
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-2 text-sm text-emerald-800">
          <p>Your location is currently being shared with authorized administrators.</p>
          {location && (
            <div className="flex items-center gap-2 font-medium bg-emerald-100/50 p-2 rounded">
              <MapPin size={14} className="text-emerald-600"/> 
              Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}
            </div>
          )}
          {lastUpdate && (
            <p className="text-xs text-emerald-600 mt-2">
              Updated {Math.floor((new Date() - lastUpdate) / 1000)} seconds ago
            </p>
          )}
        </div>

        <button onClick={handleStopSharing} className="w-full py-2.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-colors">
          Stop Sharing
        </button>
      </div>
    );
  }

  // Default / NOT SHARING
  return (
    <div className="bg-white rounded-xl border border-[var(--border-medium)] p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[var(--bg-surface-2)] text-[var(--text-secondary)] rounded-lg"><NavigationOff size={20} /></div>
        <h3 className="font-bold text-[var(--text-primary)]">LIVE LOCATION</h3>
      </div>
      
      <div className="mb-6 text-sm text-[var(--text-secondary)]">
        <p className="mb-2"><strong>Not Sharing.</strong></p>
        <p>SANCHALAN needs your live location to enable workforce tracking. When enabled, your location will be visible to authorized administrators.</p>
      </div>

      <button onClick={handleEnableLocation} className="w-full py-2.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
        Allow Location
      </button>
    </div>
  );
}

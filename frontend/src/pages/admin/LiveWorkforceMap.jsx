import React, { useState, useEffect, useCallback } from 'react';
import TopHeader from '../../components/TopHeader';
import { useSocket } from '../../context/SocketContext';
import AdminLiveMapContainer, { getWorkerStatus } from '../../components/workforce/AdminLiveMapContainer';
import LiveWorkforcePanel from '../../components/workforce/LiveWorkforcePanel';
import WorkerTrackingModal from '../../components/workforce/WorkerTrackingModal';
import { Navigation, Info } from 'lucide-react';

export default function LiveWorkforceMap() {
  const [workers, setWorkers] = useState([]);
  const [workerHistory, setWorkerHistory] = useState({});
  const [focusedWorkerId, setFocusedWorkerId] = useState(null);
  const [trackingWorkerId, setTrackingWorkerId] = useState(null);
  const [error, setError] = useState(null);
  const socket = useSocket();

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('sanchalan_token');
      const res = await fetch('http://localhost:3001/api/admin/locations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
      }
    } catch (err) {
      console.error('Failed to fetch locations', err);
      setError('Unable to fetch live locations.');
    }
  };

  useEffect(() => {
    fetchLocations();
    
    // Auto-refresh stale logic every 5 seconds without hitting API
    const interval = setInterval(() => {
      setWorkers(w => [...w]); // Trigger re-render to update STALE/OFFLINE status relative to Date.now()
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch history when worker is focused
  useEffect(() => {
    const fetchHistory = async () => {
      if (!focusedWorkerId) return;
      // Skip if we already have some history and just need to append.
      // But actually, it's safer to fetch the complete history on focus to ensure we didn't miss anything.
      try {
        const token = localStorage.getItem('sanchalan_token');
        const res = await fetch(`http://localhost:3001/api/admin/locations/${focusedWorkerId}/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWorkerHistory(prev => ({
            ...prev,
            [focusedWorkerId]: data.points || []
          }));
        }
      } catch (err) {
        console.error('Failed to fetch history', err);
      }
    };
    
    fetchHistory();
  }, [focusedWorkerId]);

  useEffect(() => {
    if (socket) {
      // Ensure we are in admin room
      socket.emit('join_admin_room');

      const handleLocationUpdated = (updatedLocation) => {
        setWorkers((prevWorkers) => {
          const index = prevWorkers.findIndex(w => w.workerId === updatedLocation.workerId);
          if (index !== -1) {
            const newWorkers = [...prevWorkers];
            newWorkers[index] = updatedLocation;
            return newWorkers;
          }
          return [...prevWorkers, updatedLocation];
        });

        // Append to history
        setWorkerHistory((prevHistory) => {
          const existingHistory = prevHistory[updatedLocation.workerId] || [];
          return {
            ...prevHistory,
            [updatedLocation.workerId]: [
              ...existingHistory,
              {
                latitude: updatedLocation.latitude,
                longitude: updatedLocation.longitude,
                accuracy: updatedLocation.accuracy,
                timestamp: updatedLocation.timestamp
              }
            ]
          };
        });
      };

      const handleLocationStopped = (data) => {
        setWorkers((prevWorkers) => {
          const index = prevWorkers.findIndex(w => w.workerId === data.workerId);
          if (index !== -1) {
            const newWorkers = [...prevWorkers];
            newWorkers[index] = { ...newWorkers[index], status: 'OFFLINE', timestamp: data.timestamp };
            return newWorkers;
          }
          return prevWorkers;
        });
      };

      socket.on('worker_location_updated', handleLocationUpdated);
      socket.on('worker_location_stopped', handleLocationStopped);

      return () => {
        socket.off('worker_location_updated', handleLocationUpdated);
        socket.off('worker_location_stopped', handleLocationStopped);
      };
    }
  }, [socket]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopHeader />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-base)] p-6 flex flex-col gap-6">
        
        {/* Status Bar */}
        <div className="flex justify-between items-center bg-[var(--bg-surface-1)] border border-[var(--border-medium)] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Navigation size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Live Workforce Map</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-[var(--text-tertiary)] uppercase font-semibold">Real-time GPS Tracking</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[11px] text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
              <Info size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[600px]">
          {/* Main Map Area */}
          <div className="flex-1 h-full rounded-xl overflow-hidden shadow-lg border border-[var(--border-medium)]">
            <AdminLiveMapContainer 
              workers={workers}
              focusedWorkerId={focusedWorkerId}
              workerHistory={workerHistory}
            />
          </div>

          {/* Right Panel */}
          <div className="w-full lg:w-80 h-full flex-shrink-0">
            <LiveWorkforcePanel 
              workers={workers}
              onSelectWorker={setFocusedWorkerId}
              focusedWorkerId={focusedWorkerId}
              workerHistory={workerHistory}
              onOpenTracking={(id) => setTrackingWorkerId(id)}
            />
          </div>
        </div>
      </div>

      {trackingWorkerId && (
        <WorkerTrackingModal
          worker={workers.find(w => w.workerId === trackingWorkerId)}
          history={workerHistory[trackingWorkerId]}
          status={getWorkerStatus(workers.find(w => w.workerId === trackingWorkerId)?.timestamp)}
          onClose={() => setTrackingWorkerId(null)}
        />
      )}
    </div>
  );
}

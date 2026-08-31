import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { 
  cacheTasks, getCachedTasks, cacheProjects, getCachedProjects, 
  processOutboxQueue, getStorageStats 
} from '../../services/mobileOfflineStore';

const MobileAuthContext = createContext(null);

import { API_URL } from '../config';

export function MobileAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sanchalan_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('sanchalan_token') || null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [outboxCount, setOutboxCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(null);
  
  const socket = useSocket();

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check of outbox count
    updateOutboxStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token]);

  const updateOutboxStats = async () => {
    try {
      const stats = await getStorageStats();
      setOutboxCount(stats.outboxCount);
    } catch (e) {
      console.warn('Storage stats error:', e);
    }
  };

  const triggerSync = async () => {
    if (!token || !navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    setSyncToast({ type: 'info', message: 'Syncing field data with server...' });
    
    try {
      const res = await processOutboxQueue(token, (prog) => {
        if (prog.status === 'FAILED') {
          console.warn('Item sync failed:', prog.current.id, prog.error);
        }
      });
      await updateOutboxStats();
      if (res.processed > 0) {
        setSyncToast({ type: 'success', message: `Synced ${res.processed} pending field update(s)!` });
      } else if (res.failed > 0) {
        setSyncToast({ type: 'warning', message: `${res.failed} item(s) failed to sync. Will retry.` });
      } else {
        setSyncToast(null);
      }
    } catch (err) {
      console.error('Outbox sync error:', err);
      setSyncToast({ type: 'error', message: 'Sync interrupted. Will retry.' });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 4000);
    }
  };

  const loginAdmin = async (email_mobile = 'admin', password = 'admin123') => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_mobile, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    
    localStorage.setItem('sanchalan_token', data.token);
    localStorage.setItem('sanchalan_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    if (socket) socket.emit('join_admin_room');
    return data.user;
  };

  const loginWorker = async (fullName = 'Arun Kumar', mobileNumber = '9999999901') => {
    const res = await fetch(`${API_URL}/api/auth/worker/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, mobileNumber })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Worker login failed');
    
    localStorage.setItem('sanchalan_token', data.token);
    localStorage.setItem('sanchalan_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    if (socket) socket.emit('join_worker_room', data.user.workerId);
    return data.user;
  };

  const registerWorker = async ({ fullName, age, gender, mobileNumber }) => {
    const res = await fetch(`${API_URL}/api/auth/worker/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, age, gender, mobileNumber })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    
    localStorage.setItem('sanchalan_token', data.token);
    localStorage.setItem('sanchalan_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('sanchalan_token');
    localStorage.removeItem('sanchalan_user');
    setToken(null);
    setUser(null);
  };

  const quickSwitchRole = async (targetRole) => {
    if (targetRole === 'ADMIN' || targetRole === 'SITE_ENGINEER') {
      return loginAdmin('admin', 'admin123');
    } else if (targetRole === 'WORKER' || targetRole === 'SUPERVISOR') {
      return loginWorker('Arun Kumar', '9999999901');
    } else if (targetRole === 'OWNER') {
      return loginAdmin('owner', 'owner123');
    }
  };

  return (
    <MobileAuthContext.Provider value={{
      user,
      token,
      isOnline,
      outboxCount,
      isSyncing,
      syncToast,
      updateOutboxStats,
      triggerSync,
      loginAdmin,
      loginWorker,
      registerWorker,
      logout,
      quickSwitchRole
    }}>
      {children}
    </MobileAuthContext.Provider>
  );
}

export function useMobileAuth() {
  const ctx = useContext(MobileAuthContext);
  if (!ctx) throw new Error('useMobileAuth must be used within MobileAuthProvider');
  return ctx;
}

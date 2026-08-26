import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import WorkerSidebar from './components/WorkerSidebar';
import WorkerHeader from './components/WorkerHeader';

export default function WorkerLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('sanchalan_user') || '{}');

  useEffect(() => {
    if (!user.id || user.role !== 'WORKER') {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <div className="theme-light flex h-screen w-full overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-[var(--border-subtle)] bg-white">
        <WorkerSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <WorkerHeader user={user} />
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet context={{ user }} />
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import AppShell from './components/AppShell';
import AdminDashboard from './pages/AdminDashboard';
import WeatherMap from './pages/admin/WeatherMap';
import LiveWorkforceMap from './pages/admin/LiveWorkforceMap';
import Login from './pages/Login';
import WorkerLayout from './pages/worker/WorkerLayout';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerTaskDetail from './pages/worker/WorkerTaskDetail';

import AdminTaskDetail from './pages/admin/AdminTaskDetail';
import AdminEvidenceVerification from './pages/admin/AdminEvidenceVerification';
import AIExecutionVisualization from './pages/admin/AIExecutionVisualization';
import RiskDelayRipple from './pages/admin/RiskDelayRipple';

import OwnerShell from './components/owner/OwnerShell';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerLiveMap from './pages/owner/OwnerLiveMap';
import OwnerIntelligence from './pages/owner/OwnerIntelligence';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<AppShell><Outlet /></AppShell>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="weather-map" element={<WeatherMap />} />
            <Route path="live-map" element={<LiveWorkforceMap />} />
            <Route path="evidence-verification" element={<AdminEvidenceVerification />} />
            <Route path="visualization" element={<AIExecutionVisualization />} />
            <Route path="risk-delay-ripple" element={<RiskDelayRipple />} />
            <Route path="tasks/:taskId" element={<AdminTaskDetail />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
          
          <Route path="/worker" element={<WorkerLayout />}>
            <Route path="dashboard" element={<WorkerDashboard />} />
            <Route path="tasks/:taskId" element={<WorkerTaskDetail />} />
            <Route path="*" element={<Navigate to="/worker/dashboard" replace />} />
          </Route>
          
          <Route path="/owner" element={<OwnerShell><Outlet /></OwnerShell>}>
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="live-map" element={<OwnerLiveMap />} />
            <Route path="intelligence" element={<OwnerIntelligence />} />
            <Route path="*" element={<Navigate to="/owner/dashboard" replace />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;

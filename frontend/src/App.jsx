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

// Mobile App Components
import { MobileAuthProvider } from './mobile/context/MobileAuthContext';
import MobileLayout from './mobile/components/MobileLayout';
import MobileHome from './mobile/pages/MobileHome';
import MobileTasks from './mobile/pages/MobileTasks';
import MobileEvidence from './mobile/pages/MobileEvidence';
import MobileFieldWalk from './mobile/pages/MobileFieldWalk';
import MobileWorkforceMap from './mobile/pages/MobileWorkforceMap';
import MobileDelayRipple from './mobile/pages/MobileDelayRipple';
import MobilePlanReality from './mobile/pages/MobilePlanReality';
import MobilePrediction from './mobile/pages/MobilePrediction';
import MobileAIRecommendations from './mobile/pages/MobileAIRecommendations';
import MobileMore from './mobile/pages/MobileMore';
import MobileOfflineQueue from './mobile/pages/MobileOfflineQueue';
import MobileProfile from './mobile/pages/MobileProfile';
import MobileLogin from './mobile/pages/MobileLogin';

function App() {
  return (
    <SocketProvider>
      <MobileAuthProvider>
        <Router>
          <Routes>
            {/* Desktop Login */}
            <Route path="/" element={<Login />} />
            
            {/* Desktop Admin */}
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
            
            {/* Desktop Worker */}
            <Route path="/worker" element={<WorkerLayout />}>
              <Route path="dashboard" element={<WorkerDashboard />} />
              <Route path="tasks/:taskId" element={<WorkerTaskDetail />} />
              <Route path="*" element={<Navigate to="/worker/dashboard" replace />} />
            </Route>
            
            {/* Desktop Owner */}
            <Route path="/owner" element={<OwnerShell><Outlet /></OwnerShell>}>
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="live-map" element={<OwnerLiveMap />} />
              <Route path="intelligence" element={<OwnerIntelligence />} />
              <Route path="*" element={<Navigate to="/owner/dashboard" replace />} />
            </Route>

            {/* SANCHALAN Mobile Application Routes */}
            <Route path="/mobile/login" element={<MobileLogin />} />
            <Route path="/mobile" element={<MobileLayout />}>
              <Route index element={<MobileHome />} />
              <Route path="tasks" element={<MobileTasks />} />
              <Route path="evidence" element={<MobileEvidence />} />
              <Route path="field-walk" element={<MobileFieldWalk />} />
              <Route path="workforce-map" element={<MobileWorkforceMap />} />
              <Route path="risks" element={<MobileDelayRipple />} />
              <Route path="plan-reality" element={<MobilePlanReality />} />
              <Route path="prediction" element={<MobilePrediction />} />
              <Route path="ai-recommendations" element={<MobileAIRecommendations />} />
              <Route path="more" element={<MobileMore />} />
              <Route path="offline-queue" element={<MobileOfflineQueue />} />
              <Route path="profile" element={<MobileProfile />} />
              <Route path="*" element={<Navigate to="/mobile" replace />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </MobileAuthProvider>
    </SocketProvider>
  );
}

export default App;


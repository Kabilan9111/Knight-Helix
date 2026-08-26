import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import AppShell from './components/AppShell';
import AdminDashboard from './pages/AdminDashboard';
import WeatherMap from './pages/admin/WeatherMap';
import Login from './pages/Login';
import WorkerLayout from './pages/worker/WorkerLayout';
import WorkerDashboard from './pages/worker/WorkerDashboard';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<AppShell><Outlet /></AppShell>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="weather-map" element={<WeatherMap />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
          
          <Route path="/worker" element={<WorkerLayout />}>
            <Route path="dashboard" element={<WorkerDashboard />} />
            <Route path="*" element={<Navigate to="/worker/dashboard" replace />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;

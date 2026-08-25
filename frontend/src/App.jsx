import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import AppShell from './components/AppShell';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import WorkerDashboard from './pages/WorkerDashboard';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin/*" element={<AppShell><AdminDashboard /></AppShell>} />
          <Route path="/worker/*" element={<WorkerDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Plus, Briefcase, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

import TopHeader from '../components/TopHeader';
import KpiCard from '../components/KpiCard';
import TaskControlCenter from '../components/TaskControlCenter';
import ProjectHealthPanel from '../components/ProjectHealthPanel';
import CreateTaskModal from './CreateTaskModal';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalProjects: 0, totalTasks: 0, inProgress: 0, atRisk: 0, overdue: 0 });
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const socket = useSocket();
  const user = JSON.parse(localStorage.getItem('sanchalan_user') || '{}');

  const fetchStats = () => fetch('http://localhost:3001/api/dashboard/stats').then(r => r.json()).then(setStats).catch(()=>null);
  const fetchTasks = () => fetch('http://localhost:3001/api/tasks').then(r => r.json()).then(setTasks).catch(()=>null);

  useEffect(() => {
    if (!user.id || user.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchStats();
    fetchTasks();
  }, [navigate]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => { fetchStats(); fetchTasks(); };
    socket.on('task_created', handleUpdate);
    socket.on('task_updated', handleUpdate);
    socket.on('task_deleted', handleUpdate);
    return () => {
      socket.off('task_created', handleUpdate);
      socket.off('task_updated', handleUpdate);
      socket.off('task_deleted', handleUpdate);
    };
  }, [socket]);

  return (
    <>
      <TopHeader 
        title="Dashboard" 
        subtitle="Real-time execution overview" 
        rightElement={
          <button className="btn btn-primary shadow-sm" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} /> Assign Task
          </button>
        }
      />
      
      <div className="flex-1 overflow-y-auto flex">
        <div className="flex-1 p-8 min-w-0 flex flex-col gap-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard label="TOTAL PROJECTS" value={stats.totalProjects} trend="stable" icon={Briefcase} />
            <KpiCard label="ACTIVE TASKS" value={stats.totalTasks} trend="up" trendValue="↑ 12%" icon={Clock} />
            <KpiCard label="IN PROGRESS" value={stats.inProgress} trend="stable" icon={CheckCircle2} colorClass="text-[var(--status-info)]" />
            <KpiCard label="AT RISK" value={stats.atRisk} trend="down" trendValue="↓ 2%" icon={AlertTriangle} colorClass="text-[var(--status-warning)]" />
            <KpiCard label="OVERDUE" value={stats.overdue} trend="up" trendValue="↑ 5%" icon={XCircle} colorClass="text-[var(--status-critical)]" />
          </div>

          <div className="flex-1 flex flex-col min-h-[400px]">
            <TaskControlCenter tasks={tasks} />
          </div>

        </div>

        <ProjectHealthPanel stats={stats} />
      </div>

      {isModalOpen && <CreateTaskModal onClose={() => setIsModalOpen(false)} onTaskCreated={fetchTasks} />}
    </>
  );
}

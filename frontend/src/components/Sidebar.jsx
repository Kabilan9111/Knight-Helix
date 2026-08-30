import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { 
  LayoutDashboard, 
  Map, 
  Users, 
  Settings, 
  LogOut, 
  HardHat,
  FileCheck,
  Activity,
  ChevronDown,
  ChevronRight,
  GitMerge,
  Bot,
  BrainCircuit,
  Navigation,
  Home, 
  FolderOpen, 
  CheckSquare, 
  Plus, 
  AlertTriangle, 
  Lightbulb, 
  Database, 
  Box, 
  BarChart2, 
  ChevronLeft
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentFilter = searchParams.get('filter') || 'all';
  const [isTasksExpanded, setIsTasksExpanded] = useState(true);
  const socket = useSocket();
  const [taskStats, setTaskStats] = useState({ assigned: 0, inProgress: 0, pending: 0, completed: 0 });

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('sanchalan_token');
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const tasksData = await res.json();
      
      let targetTasks = tasksData;
      if (tasksData.length === 0) {
        targetTasks = [
          { status: 'Pending' }, { status: 'Pending' }, { status: 'Pending' },
          { status: 'In Progress' }, { status: 'In Progress' }, { status: 'In Progress' },
          { status: 'Pending Verification' }, { status: 'Pending Verification' }, { status: 'Pending Verification' },
          { status: 'Completed' }, { status: 'Completed' }, { status: 'Completed' },
        ];
      }
      
      setTaskStats({
        assigned: targetTasks.filter(t => t.status === 'ASSIGNED' || t.status === 'Pending').length,
        inProgress: targetTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'In Progress').length,
        pending: targetTasks.filter(t => t.status === 'SUBMITTED' || t.status === 'Pending Verification' || t.status === 'At Risk').length,
        completed: targetTasks.filter(t => t.status === 'Completed').length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    if (socket) {
      socket.on('task_created', fetchStats);
      socket.on('task_updated', fetchStats);
      return () => {
        socket.off('task_created', fetchStats);
        socket.off('task_updated', fetchStats);
      };
    }
  }, [socket]);

  const handleLogout = () => {
    localStorage.removeItem('sanchalan_token');
    localStorage.removeItem('sanchalan_user');
    navigate('/login');
  };

  const NavGroup = ({ title, children }) => (
    <div className="mb-6">
      <div className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 px-6">
        {title}
      </div>
      <div className="flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  );

  const NavItem = ({ icon: Icon, label, path, active, badge, children, onClick, isExpanded }) => {
    const isActive = active || location.pathname === path;
    
    return (
      <div className="px-3">
        <button 
          onClick={onClick || (() => path && navigate(path))}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            isActive 
              ? 'bg-[var(--accent-primary)] text-white font-medium' 
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon size={16} className={isActive ? 'text-white' : 'text-[var(--text-tertiary)]'} />
            <span>{label}</span>
          </div>
          {badge !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-[var(--bg-surface-1)] text-[var(--text-tertiary)]'}`}>
              {badge}
            </span>
          )}
          {children && (
            isExpanded ? 
            <ChevronDown size={14} className="text-[var(--text-tertiary)]" /> :
            <ChevronRight size={14} className="text-[var(--text-tertiary)]" />
          )}
        </button>
      </div>
    );
  };

  const SubItem = ({ label, badge, active, onClick }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between pl-11 pr-4 py-1.5 text-[13px] transition-colors ${active ? 'text-white font-medium' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
    >
      <span>{label}</span>
      {badge !== undefined && (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${active ? 'text-white bg-white/20' : 'text-[var(--accent-primary)] bg-[var(--accent-primary-subtle)]'}`}>
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="h-full flex flex-col pt-6 pb-4 overflow-y-auto custom-scrollbar">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 mb-8 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
        <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2L3 11.5V28.5L20 38L37 28.5V11.5L20 2Z" fill="var(--accent-primary)"/>
          <path d="M20 7L9 13V27L20 33L31 27V13L20 7Z" fill="var(--bg-base)"/>
          <path d="M25 15L15 15L15 20L25 20L25 25L15 25" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <h1 className="text-[16px] font-bold tracking-wide leading-none text-white">SANCHALAN</h1>
          <p className="text-[9px] text-[var(--text-tertiary)] tracking-wider mt-0.5">Project Execution Intelligence</p>
        </div>
      </div>

      <NavGroup title="Overview">
        <NavItem icon={Home} label="Dashboard" path="/admin/dashboard" active />
      </NavGroup>

      <NavGroup title="Project Management">
        <NavItem icon={FolderOpen} label="Projects" />
        <NavItem 
          icon={CheckSquare} 
          label="Tasks" 
          onClick={() => setIsTasksExpanded(!isTasksExpanded)}
          isExpanded={isTasksExpanded}
        >
          true
        </NavItem>
        {isTasksExpanded && (
          <>
            <div className="flex flex-col gap-0.5 mb-2 transition-all">
              <SubItem label="All Tasks" active={currentFilter === 'all'} onClick={() => navigate('/admin/dashboard?filter=all')} />
              <SubItem label="Assigned" badge={taskStats.assigned} active={currentFilter === 'assigned'} onClick={() => navigate('/admin/dashboard?filter=assigned')} />
              <SubItem label="In Progress" badge={taskStats.inProgress} active={currentFilter === 'in-progress'} onClick={() => navigate('/admin/dashboard?filter=in-progress')} />
              <SubItem label="Pending Verification" badge={taskStats.pending} active={currentFilter === 'pending-verification'} onClick={() => navigate('/admin/dashboard?filter=pending-verification')} />
              <SubItem label="Completed" badge={taskStats.completed} active={currentFilter === 'completed'} onClick={() => navigate('/admin/dashboard?filter=completed')} />
            </div>
            <div className="px-4 mt-2 mb-2">
              <button className="w-full flex items-center justify-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white py-2 rounded-lg text-sm font-medium shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all">
                <Plus size={16} /> Assign New Task
              </button>
            </div>
          </>
        )}
      </NavGroup>

      <NavGroup title="Execution">
        <NavItem icon={Activity} label="Live Execution" />
        <NavItem icon={Map} label="Activities (L5/L6)" />
        <NavItem icon={FileCheck} label="Evidence Verification" path="/admin/evidence-verification" />
        <NavItem icon={GitMerge} label="Plan vs Reality" />
        <NavItem icon={Navigation} label="Live Map" path="/admin/live-map" />
        <NavItem icon={Map} label="Weather Map" path="/admin/weather-map" />
      </NavGroup>

      <NavGroup title="Intelligence">
        <NavItem icon={BrainCircuit} label="Execution Visualization" path="/admin/visualization" />
        <NavItem icon={AlertTriangle} label="Risk & Delay Ripple" path="/admin/risk-delay-ripple" />
        <NavItem icon={Lightbulb} label="AI Recommendations" />
        <NavItem icon={Database} label="Institutional Memory" />
      </NavGroup>

      <NavGroup title="Management">
        <NavItem icon={Users} label="Workers & Teams" />
        <NavItem icon={Box} label="Resources" />
        <NavItem icon={BarChart2} label="Reports" />
      </NavGroup>

      {/* Bottom section */}
      <div className="mt-auto px-4 pt-4 border-t border-[var(--border-subtle)] flex flex-col gap-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)] hover:text-white transition-colors">
          <Settings size={16} /> Settings
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)] hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Logout
        </button>
      </div>
    </div>
  );
}

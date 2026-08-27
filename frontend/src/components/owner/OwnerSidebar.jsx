import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  FolderOpen, 
  Calendar,
  Activity,
  Map,
  FileCheck,
  GitMerge,
  Navigation,
  AlertTriangle,
  Lightbulb,
  Database,
  Users,
  Box,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';

export default function OwnerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

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

  const NavItem = ({ icon: Icon, label, path, active, badge, children }) => {
    const isActive = active || (path && location.pathname === path);
    
    return (
      <div className="px-3">
        <button 
          onClick={() => path && navigate(path)}
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
          {children && <ChevronDown size={14} className="text-[var(--text-tertiary)]" />}
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col pt-6 pb-4 overflow-y-auto custom-scrollbar bg-[#0B0F19]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 mb-8 cursor-pointer" onClick={() => navigate('/owner/dashboard')}>
        <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2L3 11.5V28.5L20 38L37 28.5V11.5L20 2Z" fill="var(--accent-primary)"/>
          <path d="M20 7L9 13V27L20 33L31 27V13L20 7Z" fill="#0B0F19"/>
          <path d="M25 15L15 15L15 20L25 20L25 25L15 25" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <h1 className="text-[16px] font-bold tracking-wide leading-none text-white">SANCHALAN</h1>
          <p className="text-[9px] text-[var(--text-tertiary)] tracking-wider mt-0.5 text-purple-400">Owner Command Center</p>
        </div>
      </div>

      <NavGroup title="Overview">
        <NavItem icon={Home} label="Dashboard" path="/owner/dashboard" />
      </NavGroup>

      <NavGroup title="Projects">
        <NavItem icon={FolderOpen} label="All Projects" path="/owner/projects" />
        <NavItem icon={Activity} label="Project Progress" />
        <NavItem icon={Calendar} label="Execution Timeline" />
      </NavGroup>

      <NavGroup title="Intelligence">
        <NavItem icon={Lightbulb} label="Execution Intelligence" path="/owner/intelligence" />
        <NavItem icon={AlertTriangle} label="Risk & Delay Ripple" />
        <NavItem icon={GitMerge} label="Plan vs Reality" />
        <NavItem icon={Database} label="Institutional Memory" />
      </NavGroup>

      <NavGroup title="Visibility">
        <NavItem icon={Users} label="Live Workforce" />
        <NavItem icon={Navigation} label="Live Map" path="/owner/live-map" />
        <NavItem icon={FileCheck} label="Evidence Status" />
      </NavGroup>

      {/* Bottom section */}
      <div className="mt-auto px-4 pt-4 border-t border-[#1e1e38]/50 flex flex-col gap-1">
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

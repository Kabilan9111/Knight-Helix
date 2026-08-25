import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ClipboardList, Briefcase, Users, 
  MapPin, CloudRain, Bell, BarChart3, Settings, LogOut, Hexagon
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('sanchalan_token');
    localStorage.removeItem('sanchalan_user');
    navigate('/');
  };

  const NavItem = ({ icon: Icon, label, path }) => {
    const isActive = location.pathname.includes(path);
    return (
      <button 
        onClick={() => navigate(`/admin/${path}`)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-fast ${
          isActive 
            ? 'bg-[var(--accent-primary-subtle)] text-[var(--text-primary)]' 
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]'
        }`}
      >
        <Icon size={16} className={isActive ? 'text-[var(--accent-primary)]' : ''} />
        <span className="text-sm font-medium">{label}</span>
      </button>
    );
  };

  const NavGroup = ({ title, children }) => (
    <div className="mb-6">
      <div className="px-3 mb-2 text-caption">{title}</div>
      <div className="flex flex-col gap-1">
        {children}
      </div>
    </div>
  );

  return (
    <aside className="w-[260px] flex-shrink-0 bg-[var(--bg-surface-1)] border-r border-[var(--border-subtle)] flex flex-col h-screen select-none">
      
      <div className="h-16 flex items-center gap-3 px-6 border-b border-[var(--border-subtle)]">
        <div className="w-7 h-7 rounded-[4px] bg-[var(--accent-primary)] flex items-center justify-center">
          <Hexagon color="white" size={16} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-widest leading-none">SANCHALAN</h1>
          <p className="text-[9px] text-[var(--accent-primary)] uppercase tracking-[0.2em] mt-1 font-semibold opacity-90">Execution Intelligence</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <NavGroup title="Overview">
          <NavItem icon={LayoutDashboard} label="Dashboard" path="dashboard" />
        </NavGroup>

        <NavGroup title="Execution">
          <NavItem icon={ClipboardList} label="Tasks" path="tasks" />
          <NavItem icon={Briefcase} label="Projects" path="projects" />
          <NavItem icon={Users} label="Workers" path="workers" />
        </NavGroup>

        <NavGroup title="Monitoring">
          <NavItem icon={MapPin} label="Live Tracking" path="tracking" />
          <NavItem icon={CloudRain} label="Weather Intel" path="weather" />
          <NavItem icon={Bell} label="Alerts" path="alerts" />
        </NavGroup>

        <NavGroup title="Intelligence">
          <NavItem icon={BarChart3} label="Analytics" path="analytics" />
          <NavItem icon={Settings} label="System" path="settings" />
        </NavGroup>
      </div>

      <div className="p-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-3)] flex items-center justify-center border border-[var(--border-medium)] text-xs font-semibold text-[var(--text-primary)]">
            A
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-semibold truncate">Admin User</div>
            <div className="text-caption truncate">Project Owner</div>
          </div>
          <button onClick={handleLogout} className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--status-critical)] hover:bg-[var(--status-critical-bg)] rounded-md transition-fast">
            <LogOut size={14} />
          </button>
        </div>
      </div>
      
    </aside>
  );
}

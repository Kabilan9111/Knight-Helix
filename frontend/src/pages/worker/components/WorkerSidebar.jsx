import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, CheckSquare, Folder, User, Settings, LogOut, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function WorkerSidebar({ isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('sanchalan_token');
    localStorage.removeItem('sanchalan_user');
    navigate('/login');
  };

  const NavGroup = ({ title, children }) => (
    <div className="mb-6">
      {!isCollapsed && (
        <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 px-6">
          {title}
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  );

  const NavItem = ({ icon: Icon, label, path, active, badge }) => {
    const isActive = active || location.pathname === path;
    
    return (
      <div className={`px-3 ${isCollapsed ? 'flex justify-center mb-2' : ''}`}>
        <button 
          onClick={() => path && navigate(path)}
          title={isCollapsed ? label : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center p-2.5 rounded-lg' : 'justify-between px-3 py-2.5 w-full rounded-lg'} text-sm font-medium transition-all duration-150 ${
            isActive 
              ? 'bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)]' 
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon size={18} className={isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'} />
            {!isCollapsed && <span>{label}</span>}
          </div>
          {!isCollapsed && badge !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-surface-3)] text-[var(--text-secondary)]'}`}>
              {badge}
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col pt-6 pb-4 overflow-y-auto custom-scrollbar relative">
      {/* Brand */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'} mb-10`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/worker/dashboard')}>
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2L3 11.5V28.5L20 38L37 28.5V11.5L20 2Z" fill="var(--accent-primary)"/>
            <path d="M20 7L9 13V27L20 33L31 27V13L20 7Z" fill="white"/>
            <path d="M25 15L15 15L15 20L25 20L25 25L15 25" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isCollapsed && (
            <div>
              <h1 className="text-[16px] font-bold tracking-wide leading-none text-[var(--text-primary)]">SANCHALAN</h1>
              <p className="text-[9px] text-[var(--text-secondary)] tracking-wider mt-0.5 font-semibold">Project Execution Intelligence</p>
            </div>
          )}
        </div>
        {!isCollapsed && setIsCollapsed && (
          <button onClick={() => setIsCollapsed(true)} className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {isCollapsed && setIsCollapsed && (
        <div className="flex justify-center mb-6">
          <button onClick={() => setIsCollapsed(false)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors" title="Expand Sidebar">
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <NavGroup title="Overview">
        <NavItem icon={Home} label="Dashboard" path="/worker/dashboard" active />
      </NavGroup>

      <NavGroup title="My Work">
        <NavItem icon={CheckSquare} label="My Tasks" path="/worker/dashboard" />
        {!isCollapsed && (
          <div className="pl-11 pr-5 mt-1 flex flex-col gap-1 text-[13px] font-medium text-[var(--text-secondary)]">
            <div className="py-1 hover:text-[var(--text-primary)] cursor-pointer">Assigned</div>
            <div className="py-1 hover:text-[var(--text-primary)] cursor-pointer">In Progress</div>
            <div className="py-1 hover:text-[var(--text-primary)] cursor-pointer">Submitted</div>
            <div className="py-1 hover:text-[var(--text-primary)] cursor-pointer">Completed</div>
          </div>
        )}
      </NavGroup>

      <NavGroup title="Project">
        <NavItem icon={Folder} label="My Projects" />
      </NavGroup>

      <NavGroup title="Account">
        <NavItem icon={User} label="Profile" />
        <NavItem icon={Settings} label="Settings" />
      </NavGroup>

      {/* Bottom section */}
      <div className="mt-auto px-4 pt-4 border-t border-[var(--border-subtle)] flex flex-col gap-1">
        <button 
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={`flex items-center gap-3 ${isCollapsed ? 'justify-center p-2.5' : 'w-full px-3 py-2.5'} rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors`}
        >
          <LogOut size={18} /> {!isCollapsed && "Logout"}
        </button>
      </div>
    </div>
  );
}

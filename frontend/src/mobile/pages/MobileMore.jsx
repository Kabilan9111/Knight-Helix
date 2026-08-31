import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobileAuth } from '../context/MobileAuthContext';
import { 
  Users, Activity, BrainCircuit, Sparkles, WifiOff, 
  User, ShieldCheck, HardHat, Crown, ChevronRight, 
  LogOut, RefreshCw, Cloud, Database, ArrowRight
} from 'lucide-react';

export default function MobileMore() {
  const { user, outboxCount, isOnline, triggerSync, logout } = useMobileAuth();
  const navigate = useNavigate();

  const menuSections = [
    {
      title: 'Field Execution & Spatial',
      items: [
        {
          label: 'Live Workforce Map',
          sub: 'Field supervisor tracking & breadcrumbs',
          icon: <Users size={18} className="text-emerald-400" />,
          path: '/mobile/workforce-map'
        },
        {
          label: 'GPS Spatial Field Walk',
          sub: 'Live boundary & area geodesic walk',
          icon: <Activity size={18} className="text-amber-400" />,
          path: '/mobile/field-walk'
        }
      ]
    },
    {
      title: 'Execution Intelligence',
      items: [
        {
          label: 'Plan vs Reality Conflicts',
          sub: 'Detect schedule deviations & variances',
          icon: <Activity size={18} className="text-purple-400" />,
          path: '/mobile/plan-reality'
        },
        {
          label: 'AI Team Predictions',
          sub: 'Productivity & completion scenarios',
          icon: <BrainCircuit size={18} className="text-blue-400" />,
          path: '/mobile/prediction'
        },
        {
          label: 'AI Decision Recommendations',
          sub: 'Strategic interventions & mitigations',
          icon: <Sparkles size={18} className="text-emerald-400" />,
          path: '/mobile/ai-recommendations'
        }
      ]
    },
    {
      title: 'Offline & Device Sync',
      items: [
        {
          label: 'Offline Outbox Queue',
          sub: `${outboxCount} pending offline operations`,
          badge: outboxCount > 0 ? `${outboxCount}` : null,
          icon: <WifiOff size={18} className="text-amber-400" />,
          path: '/mobile/offline-queue'
        },
        {
          label: 'User Profile & Settings',
          sub: 'Account details and storage manager',
          icon: <User size={18} className="text-slate-300" />,
          path: '/mobile/profile'
        }
      ]
    }
  ];

  return (
    <div className="p-4 space-y-5 animate-in fade-in duration-200">
      
      {/* User Profile Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-blue-500/20">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SC'}
          </div>
          <div>
            <h3 className="text-sm font-black text-white">{user?.name || 'Site Engineer'}</h3>
            <p className="text-[11px] text-slate-400 font-mono">Role: {user?.role || 'ADMIN'}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/mobile/profile')}
          className="p-2 bg-slate-800 text-slate-300 rounded-xl"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Menu Sections */}
      {menuSections.map((sec, i) => (
        <div key={i} className="space-y-2">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
            {sec.title}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-800/60">
            {sec.items.map((item, j) => (
              <div
                key={j}
                onClick={() => navigate(item.path)}
                className="p-3.5 flex items-center justify-between hover:bg-slate-800/50 cursor-pointer active:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">{item.label}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{item.sub}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full shadow-sm animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Logout Action */}
      <button
        onClick={() => { logout(); navigate('/mobile/login'); }}
        className="w-full py-3.5 bg-red-950/60 border border-red-500/40 text-red-300 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md hover:bg-red-900/60 transition-colors"
      >
        <LogOut size={16} /> Sign Out of Mobile
      </button>

    </div>
  );
}

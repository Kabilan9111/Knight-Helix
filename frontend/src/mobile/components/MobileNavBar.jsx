import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, CheckSquare, Camera, Navigation, AlertTriangle, 
  Menu, Activity, MapPin, BrainCircuit, Sparkles
} from 'lucide-react';
import { useMobileAuth } from '../context/MobileAuthContext';

export default function MobileNavBar() {
  const { user, outboxCount } = useMobileAuth();
  const location = useLocation();

  const navItems = [
    {
      to: '/mobile',
      end: true,
      label: 'Home',
      icon: <Home size={20} />
    },
    {
      to: '/mobile/tasks',
      label: 'Tasks',
      icon: <CheckSquare size={20} />
    },
    {
      to: '/mobile/field-walk',
      label: 'GPS Walk',
      icon: <Navigation size={20} className="text-amber-400" />,
      highlight: true
    },
    {
      to: '/mobile/evidence',
      label: 'Evidence',
      icon: <Camera size={20} />,
      badge: user?.role === 'ADMIN' ? 'Review' : null
    },
    {
      to: '/mobile/risks',
      label: 'Risks & DAG',
      icon: <AlertTriangle size={20} />
    },
    {
      to: '/mobile/more',
      label: 'More',
      icon: <Menu size={20} />,
      badge: outboxCount > 0 ? `${outboxCount}` : null
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080d1a]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.end 
            ? location.pathname === item.to 
            : location.pathname.startsWith(item.to);

          if (item.highlight) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center -mt-5 relative group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-active:scale-95 border-2 ${
                  isActive 
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 border-amber-300 shadow-amber-500/40 ring-4 ring-amber-500/20' 
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white border-indigo-400/50 shadow-indigo-500/30'
                }`}>
                  <Navigation size={22} className={isActive ? 'fill-slate-950 text-slate-950' : 'text-white'} />
                </div>
                <span className={`text-[10px] font-extrabold mt-1 tracking-tight ${
                  isActive ? 'text-amber-400 font-black' : 'text-slate-300'
                }`}>
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 min-w-[50px] relative ${
                isActive 
                  ? 'text-blue-400 font-bold scale-105' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-black rounded-full shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${
                isActive ? 'text-blue-400 font-bold' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

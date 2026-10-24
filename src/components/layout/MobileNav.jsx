import { NavLink } from 'react-router-dom';
import { Home, ClipboardCheck, Map, Layers3, ChartNoAxesColumnIncreasing } from 'lucide-react';

const mobileNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/assessment', label: 'Diagnostic', icon: ClipboardCheck },
  { path: '/roadmap', label: 'Roadmap', icon: Map },
  { path: '/graph', label: 'Graph', icon: Layers3 },
  { path: '/analytics', label: 'Analytics', icon: ChartNoAxesColumnIncreasing },
];

export default function MobileNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden shadow-lg"
      aria-label="Mobile Navigation Bar"
    >
      {mobileNavItems.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
              isActive
                ? 'text-emerald-800 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`grid h-7 w-7 place-items-center rounded-lg transition ${
                  isActive ? 'bg-emerald-100 text-emerald-900' : 'bg-transparent text-slate-500'
                }`}
              >
                <Icon size={18} />
              </span>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

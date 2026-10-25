import { NavLink } from 'react-router-dom';
import { Home, ClipboardCheck, Map, Layers3, ChartNoAxesColumnIncreasing } from 'lucide-react';

const mobileNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/assessment', label: 'Diagnostic', icon: ClipboardCheck },
  { path: '/roadmap', label: 'Roadmap', icon: Map },
  { path: '/graph', label: 'Skill Graph', icon: Layers3 },
  { path: '/analytics', label: 'Analytics', icon: ChartNoAxesColumnIncreasing },
];

export default function MobileNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-1.5 backdrop-blur lg:hidden shadow-xs pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
      aria-label="Mobile Navigation Bar"
    >
      {mobileNavItems.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `flex min-h-[44px] min-w-[54px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
              isActive
                ? 'text-indigo-600 font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`grid h-6 w-6 place-items-center rounded-md transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <Icon size={18} />
              </span>
              <span className="truncate max-w-[64px]">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

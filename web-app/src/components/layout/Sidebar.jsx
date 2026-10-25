import { NavLink, Link } from 'react-router-dom';
import { ChevronRight, CircleHelp } from 'lucide-react';
import Logo from '../ui/Logo';
import { navItems } from '../../data/mockData';

export default function Sidebar({ onClose }) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-8 px-2 pt-2">
        <Logo onClick={onClose} />
      </div>

      <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
        Workspace
      </p>

      <nav className="space-y-1" aria-label="Dashboard navigation">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${isActive
                ? 'bg-green-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-green-50 hover:text-green-950'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} />
                <span>{label}</span>
                {isActive && <ChevronRight size={15} className="ml-auto" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="mb-4 rounded-2xl bg-yellow-50 p-4 border border-yellow-100">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-green-800 shadow-sm">
            <CircleHelp size={18} />
          </span>
          <p className="mt-3 text-sm font-bold text-green-950">Keep learning</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">One skill at a time adds up.</p>
        </div>

        <Link
          to="/onboarding"
          onClick={onClose}
          className="mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition"
        >
          <span>🎯</span> Recalibrate Track / Goals
        </Link>

        <Link
          to="/"
          onClick={onClose}
          className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-500 hover:bg-slate-100 transition"
        >
          ← Back to website
        </Link>
      </div>
    </div>
  );
}

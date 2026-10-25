import { NavLink, Link } from 'react-router-dom';
import { ArrowUpRight, ArrowLeft } from 'lucide-react';
import Logo from '../ui/Logo';
import { navItems } from '../../data/mockData';

export default function Sidebar({ onClose }) {
  // Read active track title if available
  let trackName = 'Full-Stack Web Development';
  try {
    const profile = JSON.parse(localStorage.getItem('skillpath_onboarding_profile') || '{}');
    if (profile.trackId === 'backend') trackName = 'Backend Systems & Arch';
    if (profile.trackId === 'devops') trackName = 'Cloud & DevOps Systems';
    if (profile.trackId === 'ai-data') trackName = 'AI & Applied ML';
  } catch {
    // Fallback
  }

  return (
    <div className="flex h-full flex-col justify-between p-4 bg-white select-none">
      <div>
        {/* Brand Header */}
        <div className="mb-6 px-2 pt-1">
          <Logo onClick={onClose} />
        </div>

        {/* Current Active Track Card */}
        <div className="mb-6 rounded-lg border border-slate-200/80 bg-slate-50 p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span>Enrolled Track</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
          <p className="mt-1 text-xs font-bold text-slate-800 line-clamp-1">{trackName}</p>
          <Link
            to="/onboarding"
            onClick={onClose}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>Change Track</span>
            <ArrowUpRight size={12} />
          </Link>
        </div>

        {/* Navigation Category Label */}
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Learning Workspace
        </p>

        {/* Navigation links */}
        <nav className="space-y-1" aria-label="Dashboard navigation">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={isActive ? 'text-indigo-600 shrink-0' : 'text-slate-400 shrink-0'}
                  />
                  <span className="flex-1 text-left">{label}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Area */}
      <div className="border-t border-slate-200 pt-3 space-y-1">
        <Link
          to="/"
          onClick={onClose}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Landing Page</span>
        </Link>
      </div>
    </div>
  );
}

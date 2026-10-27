import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, Map, ClipboardCheck, FlaskConical,
  BarChart2, Briefcase, UserCircle2,
  Settings, ArrowLeft, BookOpen, Sparkles
} from 'lucide-react';

const LEARNER_NAV = [
  { path: '/dashboard',  label: 'Dashboard',          icon: LayoutDashboard },
  { path: '/roadmap',    label: 'My Roadmap',          icon: Map },
  { path: '/assessment', label: 'Diagnostic Test',     icon: ClipboardCheck },
  { path: '/graph',      label: 'Practice & Tests',    icon: FlaskConical },
  { path: '/analytics',  label: 'Progress & Weakness', icon: BarChart2 },
  { path: '/career',     label: 'Careers Hub',         icon: Briefcase },
  { path: '/projects',   label: 'Profile & Badges',    icon: UserCircle2 },
];

const ADMIN_NAV = [
  { path: '/dashboard', label: 'Admin Dashboard', icon: Settings, badge: 'MVP' },
];

function NavItem({ path, label, icon: Icon, badge, onClose }) {
  return (
    <NavLink
      to={path}
      onClick={onClose}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm transition-all ${
          isActive
            ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100/70 shadow-2xs'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={17} className={isActive ? 'text-indigo-600 shrink-0' : 'text-slate-400 shrink-0 group-hover:text-slate-600 transition'} />
          <span className="flex-1 truncate">{label}</span>
          {badge && (
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-extrabold text-white leading-none">
              {badge}
            </span>
          )}
          {isActive && !badge && (
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ onClose }) {
  return (
    <div className="flex h-full flex-col bg-white select-none overflow-y-auto border-r border-slate-200/80">
      {/* Logo matching Landing Page */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-2xs">
          <BookOpen size={16} className="text-white" />
        </span>
        <div className="flex flex-col">
          <span className="text-base font-extrabold text-slate-900 tracking-tight leading-none">SkillPath</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 mt-1">Adaptive Studio</span>
        </div>
      </div>

      <div className="flex-1 px-3.5 py-5 space-y-6">
        {/* Learner Path section */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Learner Path
          </p>
          <nav className="space-y-1" aria-label="Learner navigation">
            {LEARNER_NAV.map((item) => (
              <NavItem key={item.path} {...item} onClose={onClose} />
            ))}
          </nav>
        </div>

        {/* Institute Admin section */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Institute Admin
          </p>
          <nav className="space-y-1" aria-label="Admin navigation">
            {ADMIN_NAV.map((item) => (
              <NavItem key={item.path} {...item} onClose={onClose} />
            ))}
          </nav>
        </div>
      </div>

      {/* Pro CTA card inside sidebar */}
      <div className="px-3 pb-3">
        <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-900">
            <Sparkles size={13} className="text-amber-500" />
            CAT v2.4 Active
          </div>
          <p className="text-[10px] text-amber-800/80 mt-0.5">Real-time IRT Ability Calibration</p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Landing</span>
        </Link>
      </div>
    </div>
  );
}

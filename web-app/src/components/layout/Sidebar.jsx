import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, ClipboardCheck, FlaskConical,
  BarChart2, Briefcase, UserCircle2,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const LEARNER_NAV = [
  { path: '/dashboard',  label: 'Dashboard',          icon: LayoutDashboard },
  { path: '/roadmap',    label: 'My Roadmap',          icon: Map, badge: 'Soon' },
  { path: '/assessment', label: 'Diagnostic Test',     icon: ClipboardCheck },
  { path: '/graph',      label: 'Skill Graph',         icon: FlaskConical },
  { path: '/analytics',  label: 'Progress & Weakness', icon: BarChart2 },
  { path: '/career',     label: 'Careers Hub',         icon: Briefcase },
  { path: '/projects',   label: 'Profile & Badges',    icon: UserCircle2 },
];

function NavItem({ path, label, icon: Icon, badge, onClose }) {
  return (
    <NavLink
      to={path}
      onClick={onClose}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm transition-all ${
          isActive
            ? 'bg-[#EFEAFC] text-[#7C5CFA] font-bold border border-[#7C5CFA]/30 shadow-2xs'
            : 'text-slate-600 hover:bg-[#F7F3E8] hover:text-slate-900 font-semibold'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={17} className={isActive ? 'text-[#7C5CFA] shrink-0' : 'text-slate-400 shrink-0 group-hover:text-slate-700 transition'} />
          <span className="flex-1 truncate">{label}</span>
          {badge && (
            <span className="rounded-full bg-[#7C5CFA] px-2 py-0.5 text-[9px] font-extrabold text-white leading-none">
              {badge}
            </span>
          )}
          {isActive && !badge && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C5CFA] shrink-0" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate('/');
  };
  return (
    <div className="flex h-full flex-col bg-white select-none overflow-y-auto border-r border-[#E8E0CC]">
      {/* Logo matching Landing Page */}
      <Link to="/" className="flex items-center gap-3 px-5 py-4 border-b border-[#E8E0CC] hover:bg-[#F7F3E8]/60 transition">
        <img
          src="/octobyte-logo.png"
          alt="octoByte Logo"
          className="h-9 w-auto max-w-[50px] object-contain drop-shadow-xs"
        />
        <div className="flex flex-col text-left leading-none">
          <span className="text-base font-black tracking-tight text-slate-900">
            <span className="text-[#2F2A3E]">octo</span>
            <span className="text-[#7C5CFA]">Byte</span>
          </span>
          <span className="text-[9px] font-extrabold tracking-widest text-[#FF9838] uppercase mt-1">
            AI Platform
          </span>
        </div>
      </Link>

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
      </div>
      {/* Footer / Log out */}
      <div className="border-t border-[#E8E0CC] p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
        >
          <LogOut size={17} className="text-rose-500 shrink-0 group-hover:text-rose-600 transition" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}

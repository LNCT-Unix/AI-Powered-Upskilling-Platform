import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Award,
  BarChart3,
  KeyRound,
  UserCircle2,
  LogOut,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';

const MENTOR_NAV = [
  { path: '/mentor', label: 'Overview', icon: LayoutDashboard },
  { path: '/mentor/students', label: 'My Students', icon: Users },
  { path: '/mentor/skills', label: 'Achieved Skills', icon: Award },
  { path: '/mentor/analytics', label: 'Test Analytics', icon: BarChart3 },
  { path: '/mentor/key', label: 'My Unique Key', icon: KeyRound },
  { path: '/mentor/profile', label: 'My Profile', icon: UserCircle2 },
];

function NavItem({ path, label, icon: Icon, end, onClose }) {
  return (
    <NavLink
      to={path}
      end={end}
      onClick={onClose}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
          isActive
            ? 'border border-[#7C5CFA]/30 bg-[#EFEAFC] font-bold text-[#7C5CFA] shadow-2xs'
            : 'text-slate-600 hover:bg-[#F7F3E8] hover:text-slate-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={17}
            className={
              isActive
                ? 'shrink-0 text-[#7C5CFA]'
                : 'shrink-0 text-slate-400 transition group-hover:text-slate-700'
            }
            aria-hidden="true"
          />
          <span className="flex-1 truncate">{label}</span>
          {isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C5CFA]" />}
        </>
      )}
    </NavLink>
  );
}

export default function MentorSidebar({ mentor, onClose, onLogout }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto border-r border-[#E8E0CC] bg-white select-none">
      <Link
        to="/"
        onClick={onClose}
        className="flex items-center gap-3 border-b border-[#E8E0CC] px-5 py-4 transition hover:bg-[#F7F3E8]/60"
      >
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
          <span className="mt-1 text-[9px] font-extrabold uppercase tracking-widest text-[#FF9838]">
            Mentor Studio
          </span>
        </div>
      </Link>

      <div className="border-b border-[#E8E0CC] p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#E8E0CC] bg-[#FDF9EE] p-3">
          <UserAvatar user={mentor} size="md" />
          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold text-[#2F2A3E]">{mentor.fullName}</p>
            <p className="truncate text-[10px] font-semibold text-[#8D8471]">@{mentor.username}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#EFEAFC] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#7C5CFA]">
              <ShieldCheck size={10} aria-hidden="true" /> Mentor
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3.5 py-5">
        <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
          Mentor Tools
        </p>
        <nav className="space-y-1" aria-label="Mentor navigation">
          {MENTOR_NAV.map((item) => (
            <NavItem key={item.path} {...item} end={item.path === '/mentor'} onClose={onClose} />
          ))}
        </nav>

        <Link
          to="/dashboard"
          onClick={onClose}
          className="mt-5 flex items-center gap-2 rounded-2xl border border-dashed border-[#D8CCAE] bg-[#FFFDF7] px-3.5 py-2.5 text-[11px] font-bold text-[#6E6880] transition hover:border-[#7C5CFA]/40 hover:bg-[#EFEAFC] hover:text-[#7C5CFA]"
        >
          <ArrowUpRight size={14} aria-hidden="true" />
          Preview Student Dashboard
        </Link>
      </div>

      <div className="border-t border-[#E8E0CC] p-3">
        <button
          type="button"
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 sm:text-sm"
        >
          <LogOut
            size={17}
            className="shrink-0 text-rose-500 transition group-hover:text-rose-600"
            aria-hidden="true"
          />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, ClipboardCheck, History, FlaskConical,
  BarChart2, Briefcase, User, Settings, Sun, Moon, LogOut,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import UserAvatar from '../ui/UserAvatar';

const LEARNER_NAV = [
  { path: '/dashboard',  label: 'Dashboard',          icon: LayoutDashboard },
  { path: '/roadmap',    label: 'My Roadmap',          icon: Map, badge: 'Soon' },
  { path: '/assessment', label: 'Diagnostic Test',     icon: ClipboardCheck },
  { path: '/history',    label: 'Test History',        icon: History },
  { path: '/graph',      label: 'Skill Graph',         icon: FlaskConical },
  { path: '/analytics',  label: 'Progress & Weakness', icon: BarChart2 },
  { path: '/career',     label: 'Careers Hub',         icon: Briefcase, badge: 'Soon' },
];

function NavItem({ path, label, icon: Icon, badge, onClose, isCollapsed }) {
  if (isCollapsed) {
    return (
      <NavLink
        to={path}
        onClick={onClose}
        title={badge ? `${label} (${badge})` : label}
        className={({ isActive }) =>
          `group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${
            isActive
              ? 'bg-[#EFEAFC] text-[#7C5CFA] font-bold border border-[#7C5CFA]/30 shadow-2xs'
              : 'text-slate-600 hover:bg-[#F7F3E8] hover:text-slate-900 font-semibold'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              size={18}
              className={isActive ? 'text-[#7C5CFA]' : 'text-slate-400 group-hover:text-slate-700 transition'}
            />
            {isActive && (
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#7C5CFA]" />
            )}
          </>
        )}
      </NavLink>
    );
  }

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

export default function Sidebar({
  onClose,
  onOpenProfileModal,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const handleToggleCollapse = onToggleCollapse || (() => setInternalCollapsed((p) => !p));

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  // Close popup on Escape key
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isProfileMenuOpen]);

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    if (onClose) onClose();
    await logout();
    navigate('/');
  };

  return (
    <div className="flex h-full flex-col bg-white select-none border-r border-[#E8E0CC] transition-all duration-300">
      {/* Logo matching Landing Page */}
      <div
        className={`flex items-center border-b border-[#E8E0CC] min-h-[69px] ${
          isCollapsed
            ? 'justify-center py-3 px-2 flex-col gap-1.5'
            : 'justify-between px-4 py-3.5'
        }`}
      >
        <Link
          to="/"
          className={`flex items-center hover:opacity-85 transition group ${
            isCollapsed ? 'justify-center p-1' : 'gap-3 min-w-0'
          }`}
          title="octoByte AI Platform"
        >
          <img
            src="/octobyte-logo.png"
            alt="octoByte Logo"
            className={`${
              isCollapsed ? 'h-8 max-w-[40px]' : 'h-9 max-w-[50px]'
            } w-auto object-contain drop-shadow-xs shrink-0`}
          />
          {!isCollapsed && (
            <div className="flex flex-col text-left leading-none truncate">
              <span className="text-base font-black tracking-tight text-slate-900">
                <span className="text-[#2F2A3E]">octo</span>
                <span className="text-[#7C5CFA]">Byte</span>
              </span>
              <span className="text-[9px] font-extrabold tracking-widest text-[#FF9838] uppercase mt-1">
                AI Platform
              </span>
            </div>
          )}
        </Link>

        {handleToggleCollapse && (
          <button
            type="button"
            onClick={handleToggleCollapse}
            className={`hidden lg:flex items-center justify-center rounded-xl text-slate-400 hover:bg-[#F7F3E8] hover:text-[#7C5CFA] transition cursor-pointer ${
              isCollapsed ? 'h-7 w-7' : 'h-8 w-8 shrink-0'
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={18} />}
          </button>
        )}
      </div>

      <div
        className={`flex-1 overflow-y-auto ${
          isCollapsed
            ? 'px-2 py-4 space-y-4 flex flex-col items-center overflow-x-hidden'
            : 'px-3.5 py-5 space-y-6'
        }`}
      >
        {/* Learner Path section */}
        <div className={isCollapsed ? 'w-full flex flex-col items-center' : ''}>
          {!isCollapsed ? (
            <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Learner Path
            </p>
          ) : (
            <div className="w-8 h-px bg-[#E8E0CC] my-1" title="Learner Path" />
          )}
          <nav
            className={
              isCollapsed
                ? 'space-y-1.5 flex flex-col items-center w-full'
                : 'space-y-1'
            }
            aria-label="Learner navigation"
          >
            {LEARNER_NAV.map((item) => (
              <NavItem
                key={item.path}
                {...item}
                isCollapsed={isCollapsed}
                onClose={onClose}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* User Profile Card & Dropup in Sidebar Bottom */}
      {user && (
        <div
          className={`relative border-t border-[#E8E0CC] ${
            isCollapsed ? 'p-3 flex justify-center' : 'p-3'
          }`}
          ref={menuRef}
        >
          {/* Popover Options Card */}
          {isProfileMenuOpen && (
            <div
              role="menu"
              aria-label="Profile options"
              className={`absolute bottom-full mb-2.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 ${
                isCollapsed ? 'left-2 w-64' : 'left-2 right-2'
              }`}
            >
              {/* User Info Header */}
              <div className="px-4 pt-3.5 pb-2.5">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {user.fullName || 'Learner'}
                </p>
                <p className="text-xs text-slate-500 truncate" title={user.email}>
                  {user.email || 'user@email.com'}
                </p>
              </div>

              <div className="border-b border-slate-100" />

              {/* Menu Items */}
              <div className="p-1.5 space-y-0.5">
                {/* Profile Settings */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    if (onClose) onClose();
                    if (onOpenProfileModal) onOpenProfileModal('profile');
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <User size={16} className="text-slate-700 shrink-0 stroke-[1.8]" />
                  <span>Profile Settings</span>
                </button>

                {/* Account Settings */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    if (onClose) onClose();
                    if (onOpenProfileModal) onOpenProfileModal('account');
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <Settings size={16} className="text-slate-700 shrink-0 stroke-[1.8]" />
                  <span>Account Settings</span>
                </button>

                {/* Light / Dark Mode Toggle */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={toggleTheme}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <>
                      <Moon size={16} className="text-slate-700 shrink-0 stroke-[1.8]" />
                      <span>Dark mode</span>
                    </>
                  ) : (
                    <>
                      <Sun size={16} className="text-slate-700 shrink-0 stroke-[1.8]" />
                      <span>Light mode</span>
                    </>
                  )}
                </button>
              </div>

              <div className="border-t border-slate-100" />

              {/* Log Out */}
              <div className="p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut size={16} className="text-red-500 shrink-0 stroke-[1.8]" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}

          {/* Profile Trigger Button */}
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="true"
            className={`group flex items-center rounded-2xl transition-colors cursor-pointer ${
              isCollapsed
                ? 'p-2 justify-center'
                : 'w-full gap-3 p-2 text-left'
            } ${
              isProfileMenuOpen ? 'bg-[#F7F3E8] ring-2 ring-[#7C5CFA]/20' : 'hover:bg-[#F7F3E8]'
            }`}
            title={user.fullName || 'User Profile Menu'}
          >
            <UserAvatar user={user} size="sm" />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 group-hover:text-[#7C5CFA] transition-colors">
                  {user.fullName || 'Learner'}
                </p>
                <p className="truncate text-[11px] font-medium text-slate-500">
                  {user.email || 'user@email.com'}
                </p>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

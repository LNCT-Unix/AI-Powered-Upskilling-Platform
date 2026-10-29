import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronDown,
  UserCog,
  Award,
  LogOut,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import UserAvatar from '../ui/UserAvatar';

export default function ProfileDropdown({ onOpenUpdateModal }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/');
  };

  const handleOpenModal = () => {
    setIsOpen(false);
    onOpenUpdateModal();
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Interactive Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`group flex items-center gap-2.5 rounded-full p-1 sm:pr-3.5 transition-all select-none border ${
          isOpen
            ? 'bg-white border-[#7C5CFA] ring-2 ring-[#7C5CFA]/20 shadow-xs'
            : 'bg-white/90 border-[#E8E0CC] hover:bg-white hover:border-slate-300 shadow-2xs'
        }`}
      >
        <UserAvatar user={user} size="sm" />

        <div className="hidden md:block text-left leading-tight pr-1">
          <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
            {user.fullName || 'Learner'}
          </p>
          <p className="text-[10px] font-semibold text-[#7C5CFA] uppercase tracking-wider">
            {user.role || 'Learner'}
          </p>
        </div>

        <ChevronDown
          size={14}
          className={`text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#7C5CFA]' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-72 rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Profile Header Card */}
          <div className="rounded-2xl bg-[#F7F3E8] p-3.5 border border-[#E8E0CC]/80 mb-2">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-black text-slate-900 truncate">
                    {user.fullName || 'Learner'}
                  </p>
                  <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 truncate" title={user.email}>
                  {user.email}
                </p>
                <div className="mt-1">
                  <span className="inline-block rounded-full bg-[#EFEAFC] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#7C5CFA]">
                    {user.role || 'Learner'}
                  </span>
                </div>
              </div>
            </div>
            {user.bio && (
              <p className="mt-2.5 text-[11px] text-slate-600 italic line-clamp-2 border-t border-[#E8E0CC] pt-2">
                &ldquo;{user.bio}&rdquo;
              </p>
            )}
          </div>

          {/* Action Menu List */}
          <div className="space-y-1 text-xs">
            {/* 1. Update Profile (Feature Request) */}
            <button
              type="button"
              onClick={handleOpenModal}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 font-bold text-slate-800 hover:bg-[#EFEAFC] hover:text-[#7C5CFA] transition-colors group cursor-pointer"
            >
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-white border border-[#E8E0CC] text-[#7C5CFA] shadow-2xs group-hover:border-[#7C5CFA]/40">
                <UserCog size={15} />
              </div>
              <div className="text-left">
                <p className="leading-none">Update Profile</p>
                <span className="text-[10px] font-normal text-slate-500">
                  Change name or avatar icon
                </span>
              </div>
            </button>

            {/* 2. Badges & Verifications */}
            <Link
              to="/projects"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 font-semibold text-slate-700 hover:bg-[#F7F3E8] hover:text-slate-900 transition-colors group"
            >
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-white border border-[#E8E0CC] text-slate-500 shadow-2xs group-hover:text-slate-800">
                <Award size={15} />
              </div>
              <div className="text-left">
                <p className="leading-none">Profile & Badges</p>
                <span className="text-[10px] font-normal text-slate-400">
                  Project verification & status
                </span>
              </div>
            </Link>

            {/* 3. Diagnostic Test Quick Link */}
            <Link
              to="/assessment"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 font-semibold text-slate-700 hover:bg-[#F7F3E8] hover:text-slate-900 transition-colors group"
            >
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-white border border-[#E8E0CC] text-amber-500 shadow-2xs">
                <Sparkles size={15} />
              </div>
              <div className="text-left">
                <p className="leading-none">Diagnostic Test</p>
                <span className="text-[10px] font-normal text-slate-400">
                  Assess ability score
                </span>
              </div>
            </Link>

            <div className="my-1 border-t border-[#E8E0CC]" />

            {/* 4. Log out */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2 font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
            >
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-white border border-rose-200 text-rose-500 shadow-2xs">
                <LogOut size={14} />
              </div>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';
import MentorSidebar from './MentorSidebar';
import UserAvatar from '../ui/UserAvatar';
import { DemoPill } from './MentorShared';
import {
  DEMO_ACHIEVEMENTS,
  DEMO_MENTOR,
  DEMO_STUDENTS,
} from '../../data/mentorDemoData';

const SECTION_LABELS = {
  '/mentor': 'Overview',
  '/mentor/students': 'My Students',
  '/mentor/skills': 'Achieved Skills',
  '/mentor/analytics': 'Test Analytics',
  '/mentor/key': 'My Unique Key',
  '/mentor/profile': 'My Profile',
};

export default function MentorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mentor, setMentor] = useState(DEMO_MENTOR);
  const [uniqueKey, setUniqueKey] = useState(DEMO_MENTOR.mentorId);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    window.clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = window.setTimeout(() => setToast(null), 3400);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const sectionLabel = useMemo(
    () => SECTION_LABELS[location.pathname] || 'Mentor Studio',
    [location.pathname],
  );

  const handleLogout = () => {
    setMobileOpen(false);
    navigate('/login', { replace: true });
  };

  const outletContext = {
    mentor,
    updateMentor: setMentor,
    uniqueKey,
    setUniqueKey,
    students: DEMO_STUDENTS,
    achievements: DEMO_ACHIEVEMENTS,
    showToast,
  };

  return (
    <div className="min-h-screen text-[#2F2A3E] lg:flex" style={{ background: '#F7F3E8' }}>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <MentorSidebar mentor={mentor} onLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close mentor navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-[#211A2E]/45 backdrop-blur-[2px]"
          />
          <aside className="relative h-full w-72 max-w-[86vw] bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3.5 top-3.5 z-10 rounded-xl border border-[#E8E0CC] bg-white p-1.5 text-[#8D8471] transition hover:bg-[#F7F3E8] hover:text-[#2F2A3E]"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <MentorSidebar
              mentor={mentor}
              onClose={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-[#E8E0CC] bg-[#F7F3E8]/92 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-7">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open mentor navigation"
                className="rounded-xl p-2 text-slate-600 transition hover:bg-white/80 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <Link to="/" className="flex items-center gap-2 lg:hidden">
                <img
                  src="/octobyte-logo.png"
                  alt="octoByte Logo"
                  className="h-7 w-auto max-w-[42px] object-contain"
                />
                <span className="text-sm font-black text-slate-900">
                  <span className="text-[#2F2A3E]">octo</span>
                  <span className="text-[#7C5CFA]">Byte</span>
                </span>
              </Link>

              <div className="hidden min-w-0 items-center gap-1.5 sm:flex">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E4D7FF] bg-[#EFEAFC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#6244E8]">
                  <GraduationCap size={12} aria-hidden="true" />
                  Mentor Studio
                </span>
                <ChevronRight size={13} className="shrink-0 text-[#B6AD9C]" aria-hidden="true" />
                <span className="truncate text-xs font-bold text-[#6E6880]">{sectionLabel}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div
                className="hidden items-center rounded-full border border-[#E8E0CC] bg-white p-0.5 shadow-2xs sm:flex"
                role="group"
                aria-label="Preview role"
              >
                <Link
                  to="/dashboard"
                  className="rounded-full px-3 py-1 text-[10px] font-bold text-[#8D8471] transition hover:bg-[#F7F3E8] hover:text-[#2F2A3E]"
                >
                  Student
                </Link>
                <span className="rounded-full bg-[#7C5CFA] px-3 py-1 text-[10px] font-extrabold text-white shadow-2xs">
                  Mentor
                </span>
              </div>

              <DemoPill className="hidden md:inline-flex">Demo mode</DemoPill>

              <Link
                to="/mentor/profile"
                aria-label="Open mentor profile"
                className="rounded-full border border-[#E8E0CC] bg-white p-1 shadow-2xs transition hover:border-[#7C5CFA]/40"
              >
                <UserAvatar user={mentor} size="sm" />
              </Link>
            </div>
          </div>
        </header>

        <main className="w-full flex-1 pb-16">
          <Outlet context={outletContext} />
        </main>
      </div>

      {/* Toast feedback */}
      <div
        className={`pointer-events-none fixed bottom-5 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 transition-all duration-300 ${
          toast ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <div
            className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-xl ${
              toast.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : 'border-[#C8EFDD] bg-[#E7F8EF] text-[#146C4F]'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

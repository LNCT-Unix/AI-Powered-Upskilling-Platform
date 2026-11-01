import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import MentorSidebar from './MentorSidebar';
import UserAvatar from '../ui/UserAvatar';
import { useAuth } from '../../hooks/useAuth';
import { mentorService } from '../../services/mentorService';
import OctoMascot from '../common/OctoMascot';
import { usePostLoginTransition } from '../../context/PostLoginTransitionContext';

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
  const { user, logout } = useAuth();
  const { isTransitioning, hasLanded } = usePostLoginTransition();

  const [mentor, setMentor] = useState({
    fullName: user?.fullName || user?.username || 'Mentor',
    username: user?.username || '',
    email: user?.email || '',
    title: '',
    location: '',
    bio: '',
    expertise: [],
    joinedAt: null,
    avatarUrl: null,
    role: 'MENTOR',
  });
  const [uniqueKey, setUniqueKey] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    window.clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = window.setTimeout(() => setToast(null), 3400);
  }, []);

  const refreshProfileAndKey = useCallback(async () => {
    try {
      const [profileRes, keyRes] = await Promise.allSettled([
        mentorService.getProfile(),
        mentorService.getKey(),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
        const p = profileRes.value.data;
        setMentor((prev) => ({
          ...prev,
          fullName: p.fullName || prev.fullName,
          username: p.username || prev.username,
          email: p.email || prev.email,
          title: p.title || prev.title,
          location: p.location || prev.location,
          bio: p.bio || prev.bio,
          expertise: p.expertise && p.expertise.length > 0 ? p.expertise : prev.expertise,
          joinedAt: p.joinedAt || prev.joinedAt,
          avatarUrl: p.avatarUrl,
        }));
      }

      if (keyRes.status === 'fulfilled' && keyRes.value?.data?.key) {
        setUniqueKey(keyRes.value.data.key);
      }
    } catch {
      // Retain existing state on network error
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.allSettled([mentorService.getProfile(), mentorService.getKey()])
      .then(([profileRes, keyRes]) => {
        if (!active) return;
        if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
          const p = profileRes.value.data;
          setMentor((prev) => ({
            ...prev,
            fullName: p.fullName || prev.fullName,
            username: p.username || prev.username,
            email: p.email || prev.email,
            title: p.title || prev.title,
            location: p.location || prev.location,
            bio: p.bio || prev.bio,
            expertise: p.expertise && p.expertise.length > 0 ? p.expertise : prev.expertise,
            joinedAt: p.joinedAt || prev.joinedAt,
            avatarUrl: p.avatarUrl,
          }));
        }
        if (keyRes.status === 'fulfilled' && keyRes.value?.data?.key) {
          setUniqueKey(keyRes.value.data.key);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const sectionLabel = useMemo(
    () => SECTION_LABELS[location.pathname] || 'Mentor Studio',
    [location.pathname],
  );

  const handleLogout = async () => {
    setMobileOpen(false);
    try {
      if (logout) await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const outletContext = {
    mentor,
    updateMentor: setMentor,
    uniqueKey,
    setUniqueKey,
    refreshMentor: refreshProfileAndKey,
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

      {/* Main content surface */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E8E0CC] bg-[#FFFDF7]/90 px-4 backdrop-blur-md sm:px-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E8E0CC] bg-white text-[#2F2A3E] shadow-2xs transition hover:bg-[#F7F3E8] lg:hidden"
              aria-label="Open mentor navigation menu"
            >
              <Menu size={18} />
            </button>

            {/* Mentor Top Navbar Logo with Mascot */}
            <Link to="/mentor" className="flex items-center gap-2 group select-none mr-1 sm:mr-2">
              <div
                id="mentor-navbar-mascot-target"
                className={`navbar-octo-target relative flex items-center justify-center shrink-0 w-8 h-8 transition-all duration-300 ${
                  isTransitioning && !hasLanded ? 'opacity-0 scale-75' : 'opacity-100 scale-100 navbar-mascot-settled'
                }`}
              >
                <OctoMascot size={28} idPrefix="mentor-nav-octo" animated={true} withBook={true} />
              </div>
              <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 leading-none hidden xs:inline">
                <span className="text-[#2F2A3E]">octo</span>
                <span className="text-[#7C5CFA]">Byte</span>
              </span>
            </Link>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
              <Link
                to="/mentor"
                className="font-bold text-[#8D8471] transition hover:text-[#7C5CFA]"
              >
                Mentor
              </Link>
              <ChevronRight size={13} className="text-[#B6AD9A]" />
              <span className="font-extrabold text-[#2F2A3E]">{sectionLabel}</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/mentor/profile"
              className="flex items-center gap-2 rounded-2xl border border-[#E8E0CC] bg-white py-1.5 pl-1.5 pr-3 shadow-2xs transition hover:border-[#7C5CFA] hover:shadow-xs"
            >
              <UserAvatar user={mentor} size="sm" />
              <div className="hidden text-left sm:block">
                <div className="text-xs font-extrabold leading-tight text-[#2F2A3E]">
                  {mentor.fullName}
                </div>
                <div className="text-[10px] font-medium text-[#8D8471]">
                  @{mentor.username}
                </div>
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="min-w-0 flex-1">
          <Outlet context={outletContext} />
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-center gap-2.5 rounded-2xl border border-[#2F2A3E] bg-[#2F2A3E] px-4 py-3 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-bottom-3"
        >
          {toast.type === 'error' ? (
            <AlertCircle size={16} className="shrink-0 text-[#FF5A5A]" />
          ) : (
            <CheckCircle2 size={16} className="shrink-0 text-[#28D196]" />
          )}
          <span>{toast.message}</span>
        </aside>
      )}
    </div>
  );
}

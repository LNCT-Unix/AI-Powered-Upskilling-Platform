import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, Bell, X } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useAuth } from '../../hooks/useAuth';
import ProfileDropdown from '../profile/ProfileDropdown';
import UpdateProfileModal from '../profile/UpdateProfileModal';
import OctoMascot from '../common/OctoMascot';
import { usePostLoginTransition } from '../../context/PostLoginTransitionContext';

export default function DashboardShell() {
  const [mobileOpen, setMobileOpen]               = useState(false);
  const [notificationsOpen, setNotifOpen]         = useState(false);
  const [updateProfileOpen, setUpdateProfileOpen] = useState(false);
  const { user } = useAuth();
  const { isTransitioning, hasLanded } = usePostLoginTransition();

  return (
    <div className="min-h-screen lg:flex text-slate-900" style={{ background: '#F7F3E8' }}>
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-white lg:block shadow-2xs">
        <Sidebar />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
          />
          <aside className="relative h-full w-72 max-w-[85vw] bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3.5 top-3.5 z-10 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="min-w-0 flex-1 flex flex-col">
        {/* ── Top bar ── matching Landing Page aesthetic ─────── */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E8E0CC] px-4 py-2.5 sm:py-3 sm:px-8 gap-4 bg-[#F7F3E8]/95 backdrop-blur-md pt-[max(env(safe-area-inset-top),0.625rem)]">
          {/* Left: mobile hamburger + Octobyte Logo & Mascot */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              className="rounded-xl p-2 text-slate-600 hover:bg-white/80 transition lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Octobyte Logo with Mascot in Top Navbar */}
            <Link to="/dashboard" className="flex items-center gap-2.5 group select-none">
              <div
                id="navbar-octobyte-mascot-target"
                className={`navbar-octo-target relative flex items-center justify-center shrink-0 w-8 h-8 sm:w-9 sm:h-9 transition-all duration-300 ${
                  isTransitioning && !hasLanded ? 'opacity-0 scale-75' : 'opacity-100 scale-100 navbar-mascot-settled'
                }`}
              >
                <OctoMascot size={32} idPrefix="shell-nav-octo" animated={true} withBook={true} />
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
                <span className="text-[#2F2A3E]">octo</span>
                <span className="text-[#7C5CFA]">Byte</span>
              </span>
            </Link>
          </div>

          {/* Right: notifications + user profile dropdown */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notification bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(p => !p)}
                aria-label="View notifications"
                className="relative rounded-full p-2 bg-white/90 border border-[#E8E0CC] text-slate-500 hover:text-slate-900 hover:bg-white transition shadow-2xs"
              >
                <Bell size={16} />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#7C5CFA] ring-2 ring-white" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2.5 w-80 rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between border-b border-[#E8E0CC] pb-3 mb-3">
                    <p className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Notifications</p>
                    <button type="button" onClick={() => setNotifOpen(false)} className="text-xs text-[#7C5CFA] font-bold hover:underline">
                      Close
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="rounded-2xl bg-[#EFEAFC] border border-[#7C5CFA]/20 p-3">
                      <p className="font-bold text-[#2F2A3E]">Diagnostic Assessment Ready</p>
                      <p className="text-[#6E6880] text-[11px] mt-0.5">Start your 10-question CAT to update your ability score.</p>
                    </div>
                    <div className="rounded-2xl bg-[#FFEEDD] border border-[#FFD9B8] p-3">
                      <p className="font-bold text-[#B45A14]">Daily Learning Streak Active</p>
                      <p className="text-[#8D8471] text-[11px] mt-0.5">Solve 1 coding or conceptual milestone today.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile dropdown or Auth actions */}
            {user ? (
              <ProfileDropdown onOpenUpdateModal={() => setUpdateProfileOpen(true)} />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-slate-700 hover:text-indigo-600 px-3 py-1.5 transition"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 w-full pb-20 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>

      {/* Global Profile Update Modal */}
      <UpdateProfileModal
        isOpen={updateProfileOpen}
        onClose={() => setUpdateProfileOpen(false)}
      />
    </div>
  );
}

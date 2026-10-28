import { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Menu, Bell, LogOut, X, Search } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardShell() {
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [notificationsOpen, setNotifOpen] = useState(false);
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => { await logout(); navigate('/'); };

  // User initials for avatar
  const initials = user?.fullName
    ? user.fullName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : 'SP';

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
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E8E0CC] px-4 py-3 sm:px-8 gap-4 bg-[#F7F3E8]/90 backdrop-blur-md">
          {/* Left: mobile hamburger + search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              className="rounded-xl p-2 text-slate-600 hover:bg-white/80 transition lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Mobile logo when sidebar hidden */}
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

            {/* Search bar with warm pill styling */}
            <div className="relative hidden sm:flex flex-1 max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Search competencies, roadmaps, career benchmarks..."
                className="w-full rounded-full border border-[#E8E0CC] bg-white/95 py-2 pl-9 pr-4 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#7C5CFA] focus:bg-white focus:ring-2 focus:ring-[#7C5CFA]/20 transition shadow-2xs"
              />
            </div>
          </div>

          {/* Right: notifications + user avatar */}
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

            {/* User Profile avatar pill */}
            {user ? (
              <div className="flex items-center gap-2 pl-1">
                <div className="hidden md:block text-right leading-none">
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                    {user.fullName || 'Learner'}
                  </p>
                  <p className="text-[10px] font-semibold text-indigo-600 mt-1 uppercase tracking-wider">
                    {user.role || 'Learner'}
                  </p>
                </div>
                <span className="grid h-8 w-8 place-items-center rounded-2xl bg-yellow-400 text-xs font-black text-slate-900 shadow-2xs">
                  {initials}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-700 transition"
                >
                  <LogOut size={15} />
                </button>
              </div>
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
        <main id="main-content" className="flex-1 w-full">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </div>
  );
}

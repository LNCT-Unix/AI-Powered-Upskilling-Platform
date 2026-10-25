import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, Globe, X, User } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Logo from '../ui/Logo';
import { navItems } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

export default function DashboardShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  const currentItem = navItems.find((n) => n.path === location.pathname);
  const activeTitle = currentItem?.label || 'Learning Space';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex text-slate-900">
      {/* Desktop Sticky Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200/90 bg-white lg:block">
        <Sidebar />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
          />
          <aside className="relative h-full w-72 max-w-[80vw] bg-white shadow-xl">
            <div className="absolute right-3 top-4 z-10">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="min-w-0 flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 py-2.5 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500">
              <span className="font-medium">Workspace</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-900">{activeTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Multilingual Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 shadow-2xs">
              <Globe size={14} className="mr-1.5 text-indigo-600" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Choose platform language"
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="en">EN</option>
                <option value="hi">हिन्दी</option>
                <option value="hinglish">Hinglish</option>
              </select>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                aria-label="View notifications"
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Notifications
                    </p>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs text-indigo-600 hover:underline font-medium"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                      <p className="font-semibold text-slate-800">Diagnostic Ready</p>
                      <p className="mt-0.5 text-slate-500">
                        Take your 10-question adaptive assessment to calibrate milestones.
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                      <p className="font-semibold text-slate-800">Streak Active</p>
                      <p className="mt-0.5 text-slate-500">
                        Keep up your study habit today to protect your progress ring.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Info */}
            <div className="hidden text-right sm:block leading-tight">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                {user?.fullName || 'Active Learner'}
              </p>
              <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                {user?.email || 'learner@platform.io'}
              </p>
            </div>

            {/* Avatar Pill */}
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
              <User size={15} />
            </span>

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 flex-1 w-full">
          {children || <Outlet />}
          <footer className="mt-12 border-t border-slate-200/80 pt-6 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>AI-Powered Upskilling Platform · Adaptive Learning & Verification</span>
            <span className="text-[11px] text-slate-400">WCAG 2.2 AA Compliant · Secure Session</span>
          </footer>
        </main>

        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </div>
  );
}

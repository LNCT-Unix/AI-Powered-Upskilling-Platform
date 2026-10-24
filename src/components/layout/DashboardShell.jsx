import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell, GraduationCap } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Logo from '../ui/Logo';
import { navItems } from '../../data/mockData';

export default function DashboardShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentItem = navItems.find((n) => n.path === location.pathname);
  const activeTitle = currentItem?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Desktop Sticky Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <Sidebar />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-green-950/40 backdrop-blur-xs"
          />
          <aside className="relative h-full w-72 bg-white shadow-xl">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="min-w-0 flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl p-2 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="lg:hidden">
              <Logo />
            </div>
            <p className="hidden text-sm font-bold text-green-950 lg:block">{activeTitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.alert('You’re all caught up! This is a sample notification.')}
              aria-label="Notifications"
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition"
            >
              <Bell size={19} />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-green-950">Student account</p>
              <p className="text-xs text-slate-500">Sample profile</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-yellow-300 text-sm font-extrabold text-green-950 ring-4 ring-yellow-50">
              <GraduationCap size={19} />
            </span>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex-1 w-full">
          {children || <Outlet />}
          <footer className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-400">
            AiUpskilling Platform · Learning progress preview · Sample data only
          </footer>
        </main>

        {/* Mobile Thumb-Zone Navigation */}
        <MobileNav />
      </div>
    </div>
  );
}

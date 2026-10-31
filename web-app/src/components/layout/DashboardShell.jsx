import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useAuth } from '../../hooks/useAuth';
import UpdateProfileModal from '../profile/UpdateProfileModal';

export default function DashboardShell() {
  const [mobileOpen, setMobileOpen]               = useState(false);
  const [updateProfileOpen, setUpdateProfileOpen] = useState(false);
  const [profileModalSection, setProfileModalSection] = useState('profile');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    }
    return false;
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  const handleOpenProfileModal = (section = 'profile') => {
    setProfileModalSection(section);
    setUpdateProfileOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen lg:flex text-slate-900" style={{ background: '#F7F3E8' }}>
      {/* Desktop Sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 bg-white lg:block shadow-2xs transition-[width] duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          onOpenProfileModal={handleOpenProfileModal}
        />
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
            <Sidebar
              isCollapsed={false}
              onClose={() => setMobileOpen(false)}
              onOpenProfileModal={handleOpenProfileModal}
            />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="min-w-0 flex-1 flex flex-col">
        {/* ── Top bar ── matching Landing Page aesthetic ─────── */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E8E0CC] px-4 py-2.5 sm:py-3 sm:px-8 gap-4 bg-[#F7F3E8]/95 backdrop-blur-md pt-[max(env(safe-area-inset-top),0.625rem)]">
          {/* Left: mobile hamburger + desktop sidebar toggle + logo on mobile */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              className="rounded-xl p-2 text-slate-600 hover:bg-white/80 transition lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Desktop toggle button in top bar */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden lg:flex items-center justify-center rounded-xl p-2 text-slate-500 hover:bg-white hover:text-[#7C5CFA] border border-transparent hover:border-[#E8E0CC] transition shadow-2xs cursor-pointer"
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
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
          </div>

          {/* Right: Auth actions / Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* User Profile dropdown or Auth actions */}
            {user ? (
              /* Top-right corner Logout button */
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="rounded-full p-2 bg-white/90 border border-[#E8E0CC] text-slate-500 hover:text-slate-900 hover:bg-white transition shadow-2xs cursor-pointer"
              >
                <LogOut size={16} />
              </button>
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
        initialSection={profileModalSection}
        onClose={() => setUpdateProfileOpen(false)}
      />
    </div>
  );
}

import React from 'react';
import { Search, Globe, ChevronDown, Flame, User } from 'lucide-react';

export default function TopNavbar({ userData, currentView, setCurrentView }) {
  return (
    <header className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search Python tracks, NPTEL modules, ATS keywords..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Controls & Profile Dropdown */}
        <div className="flex items-center gap-4">
          
          {/* View Mode Selector (Matching video flow) */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setCurrentView('auth')}
              className={`px-3 py-1 rounded-md transition-all ${
                currentView === 'auth' ? 'bg-cyan-500 text-slate-950 font-bold shadow-cyan-glow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In / Auth
            </button>
            <button
              onClick={() => setCurrentView('onboarding')}
              className={`px-3 py-1 rounded-md transition-all ${
                currentView === 'onboarding' ? 'bg-cyan-500 text-slate-950 font-bold shadow-cyan-glow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Onboarding
            </button>
            <button
              onClick={() => setCurrentView('diagnostic')}
              className={`px-3 py-1 rounded-md transition-all ${
                currentView === 'diagnostic' ? 'bg-cyan-500 text-slate-950 font-bold shadow-cyan-glow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Diagnostic
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-3 py-1 rounded-md transition-all ${
                currentView === 'dashboard' ? 'bg-cyan-500 text-slate-950 font-bold shadow-cyan-glow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Platform App
            </button>
          </div>

          {/* Language Picker */}
          <button className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Globe className="w-3.5 h-3.5" />
            <span>English</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {/* Streak Meter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-cyan-500/30 px-3 py-1.5 rounded-xl">
            <Flame className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-white">{userData.streak}d</span>
          </div>

          {/* User Profile Tag */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-cyan-500/40 p-0.5 overflow-hidden">
              <img src={userData.avatar} alt={userData.name} className="w-full h-full rounded object-cover" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-white">{userData.name}</p>
              <p className="text-[10px] text-cyan-400 font-mono">Student</p>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}

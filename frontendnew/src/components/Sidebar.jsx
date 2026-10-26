import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  CheckSquare, 
  BookOpen, 
  BarChart3, 
  Calendar, 
  Briefcase, 
  Award, 
  Building2, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activeNav, setActiveNav }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'roadmap', label: 'My Roadmap', icon: Map, tag: 'ADAPTIVE' },
    { id: 'practice', label: 'Practice & Tests', icon: CheckSquare },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'analytics', label: 'Progress & Analytics', icon: BarChart3 },
    { id: 'planner', label: 'Study Planner', icon: Calendar },
    { id: 'careers', label: 'Careers & ATS', icon: Briefcase, tag: 'ATS' },
    { id: 'badges', label: 'Certificates & Badges', icon: Award },
    { id: 'institute', label: 'Institute Admin', icon: Building2, tag: 'BATCH' },
  ];

  return (
    <aside className="w-64 bg-[#060a12] border-r border-cyan-500/20 flex flex-col justify-between shrink-0 hidden md:flex min-h-screen">
      <div>
        {/* Brand Logo Header */}
        <div className="p-5 border-b border-cyan-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shadow-cyan-glow-sm">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">AI Upskilling Platform</h1>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">PRO</span>
            </div>
          </div>
        </div>

        {/* Selected Target Track Box */}
        <div className="mx-4 my-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">TARGET TRACK</span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white truncate">Backend Engineer</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">48%</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-cyan-glow font-bold'
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.tag && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.tag}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Support Button */}
      <div className="p-4 border-t border-slate-900">
        <button className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 text-xs flex items-center gap-2 transition-all">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Accessibility & Help</span>
        </button>
      </div>
    </aside>
  );
}

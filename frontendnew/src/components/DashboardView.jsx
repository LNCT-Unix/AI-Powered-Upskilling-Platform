import React from 'react';
import { Sparkles, ArrowRight, Play, CheckCircle2, Clock, Calendar, Bookmark, Video } from 'lucide-react';

export default function DashboardView({ userData, modules, onNavigate }) {
  const currentModule = modules[1]; // Module 2 (PostgreSQL) as featured in reference video

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner Card */}
      <div className="relative bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-8 shadow-cyan-glow overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> ADAPTIVE ENGINE ACTIVE
            </span>
          </div>
          <h2 className="text-3xl font-black text-white">Welcome back, {userData.name}</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {userData.role} • {userData.college} • Target Date: 2026-12-15
          </p>

          {/* Current Active Module Box */}
          <div className="bg-slate-950 border border-cyan-500/20 p-5 rounded-2xl space-y-3 mt-4">
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              CURRENT MODULE 02 • ESTIMATED 24 HRS REMAINING
            </span>
            <h3 className="text-base font-bold text-white">{currentModule.title}</h3>
            <p className="text-xs text-slate-400">{currentModule.description}</p>
            
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('roadmap')}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-cyan-glow transition-all flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Continue Learning</span>
              </button>
              <button
                onClick={() => onNavigate('practice')}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 font-bold text-xs rounded-xl transition-all"
              >
                Practice Drills
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Learning Path + Sidebar Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Learning Path Modules */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Your Learning Path</h3>
            <button onClick={() => onNavigate('roadmap')} className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              View All ({modules.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {modules.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">{m.category}</span>
                    <span className="text-[10px] text-cyan-400 font-mono">• {m.relevance}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{m.title}</h4>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                    m.status === 'mastered'
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : m.status === 'in-progress'
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-cyan-glow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}>
                    {m.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Topics Review & Handpicked Resources */}
        <div className="space-y-6">
          
          {/* Topics Needing Review Widget */}
          <div className="bg-slate-900/80 border border-cyan-500/20 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-300">Topics Needing Review</h4>
            <div className="space-y-3">
              {[
                { name: "B-Tree Leftmost Prefix Rule", score: "32%" },
                { name: "Redis Cache Stampede & SETNX", score: "44%" },
                { name: "JWT Refresh Rotation & RBAC", score: "48%" },
              ].map((t, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 truncate max-w-[170px]">{t.name}</span>
                  <span className="font-mono text-cyan-400 font-bold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">{t.score}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate('practice')}
              className="w-full py-2 bg-slate-950 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 font-bold text-xs rounded-xl transition-all"
            >
              Practice Weak Topics →
            </button>
          </div>

          {/* Handpicked Video Resources */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" /> Handpicked Resources
            </h4>

            <div className="space-y-2">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[9px] uppercase font-mono bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded">VIDEO</span>
                <p className="text-xs font-bold text-white mt-1">PostgreSQL Indexing & Query Executor Masterclass</p>
                <p className="text-[10px] text-slate-400 mt-1">Deep dive into B-Trees, Heap scans, EXPLAIN ANALYZE</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

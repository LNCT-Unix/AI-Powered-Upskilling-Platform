import React from 'react';
import { CheckCircle2, Clock, Circle, ExternalLink, Play } from 'lucide-react';

export default function RoadmapView({ modules }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-cyan-500/20 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            TARGET TRACK: BACKEND ENGINEER
          </span>
          <h2 className="text-2xl font-black text-white mt-2">Backend Engineer Roadmap</h2>
          <p className="text-xs text-slate-400 mt-1">Tailored based on your diagnostic baseline assessment across Indian tech job requirements.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono">
            {modules.length} Modules Total
          </span>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {modules.map((m, index) => (
          <div key={m.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/30 transition-all">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded">
                    MODULE 0{index + 1}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{m.category}</span>
                  <span className="text-xs text-cyan-400 font-mono">• {m.relevance}</span>
                </div>

                <h3 className="text-lg font-bold text-white">{m.title}</h3>
                {m.description && <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>}

                {/* Module Skills Pills */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {m.skills.map((s, i) => (
                    <span key={i} className="text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-300 px-2 py-1 rounded-lg">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex md:flex-col items-center justify-between gap-3 shrink-0">
                <button className={`w-full md:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  m.status === 'mastered'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : m.status === 'in-progress'
                    ? 'bg-cyan-500 text-slate-950 shadow-cyan-glow hover:bg-cyan-400'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{m.status === 'mastered' ? 'Mastered' : m.status === 'in-progress' ? 'Continue Lesson' : 'Start Module'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

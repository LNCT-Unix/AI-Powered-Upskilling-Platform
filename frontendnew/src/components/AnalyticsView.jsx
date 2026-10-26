import React from 'react';
import { BarChart3, Clock, CheckCircle, TrendingUp } from 'lucide-react';

export default function AnalyticsView({ userData }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-cyan-500/20 p-6 rounded-2xl">
        <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
          PERFORMANCE & SKILL-METRICS
        </span>
        <h2 className="text-2xl font-black text-white mt-2">Progress & Granular Weak-Topic Analytics</h2>
        <p className="text-xs text-slate-400 mt-1">Real-time telemetry measuring question accuracy, response speed, and topic readiness.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-cyan-500/30 p-5 rounded-2xl shadow-cyan-glow-sm">
          <span className="text-xs text-slate-400 font-mono">OVERALL READINESS</span>
          <p className="text-3xl font-black font-mono text-cyan-400 mt-2">{userData.overallReadiness}%</p>
          <span className="text-[10px] text-slate-500">Verified by Diagnostic</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-mono">TIME INVESTED</span>
          <p className="text-3xl font-black font-mono text-white mt-2">38.5 hrs</p>
          <span className="text-[10px] text-slate-500">Across 14 Days</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-mono">DAILY CONSISTENCY</span>
          <p className="text-3xl font-black font-mono text-cyan-400 mt-2">{userData.streak} Days</p>
          <span className="text-[10px] text-slate-500">Streak Maintained</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-mono">ACCURACY TREND</span>
          <p className="text-3xl font-black font-mono text-white mt-2">74.2%</p>
          <span className="text-[10px] text-slate-500">+4.2% vs last week</span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Building2, Users, Download, ShieldCheck } from 'lucide-react';

export default function InstituteAdminView() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-cyan-500/20 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            INSTITUTE ADMINISTRATION PORTAL • BATCH 2026
          </span>
          <h2 className="text-2xl font-black text-white mt-2">Apex Institute of Technology, Pune</h2>
          <p className="text-xs text-slate-400 mt-1">Track student readiness, identify struggling sub-cohorts, and assign custom curriculum.</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl flex items-center gap-2 hover:border-cyan-500/40">
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Bulk CSV Export</span>
          </button>
        </div>
      </div>

      {/* Cohort Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-mono">COHORT ENROLLMENT</span>
          <p className="text-3xl font-black font-mono text-white mt-1">128</p>
          <span className="text-[10px] text-slate-500">Active Students</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-mono">COHORT COMPLETION</span>
          <p className="text-3xl font-black font-mono text-cyan-400 mt-1">72.4%</p>
          <span className="text-[10px] text-slate-500">+12% vs last semester</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-mono">AVERAGE SCORE</span>
          <p className="text-3xl font-black font-mono text-white mt-1">74.8 / 100</p>
          <span className="text-[10px] text-slate-500">Evaluated across 4 quizzes</span>
        </div>
      </div>
    </div>
  );
}

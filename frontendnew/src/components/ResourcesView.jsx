import React, { useState } from 'react';
import { Search, ExternalLink, Bookmark, Tag } from 'lucide-react';

export default function ResourcesView() {
  const [filter, setFilter] = useState('All');

  const resources = [
    { title: "Designing Data-Intensive Applications (DDIA)", category: "Reading & Articles", level: "Advanced", type: "BOOK" },
    { title: "Node.js & Express Production Backend Architecture (Hindi)", category: "Videos (YouTube/NPTEL)", level: "Intermediate", type: "VIDEO" },
    { title: "PostgreSQL Indexing & Query Execution Masterclass", category: "Structured Courses", level: "Beginner", type: "COURSE" },
    { title: "SQL Performance Explained: B-Trees to Table Scans", category: "Reading & Articles", level: "Intermediate", type: "BOOK" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-cyan-500/20 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-cyan-400" /> Personalized Resources & Documentation
          </h2>
          <p className="text-xs text-slate-400 mt-1">Curated library for backend engineering, PostgreSQL, Redis, and system design.</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search topics, video links..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-900 pb-3">
        {['All Resources', 'Videos (YouTube/NPTEL)', 'Official Docs & Cheatsheets', 'Structured Courses', 'Reading & Articles'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filter === tab ? 'bg-cyan-500 text-slate-950 font-bold shadow-cyan-glow-sm' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((res, i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded">
                  {res.type}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{res.level}</span>
              </div>
              <h3 className="font-bold text-white mb-2 text-sm">{res.title}</h3>
              <p className="text-xs text-slate-400 mb-4">{res.category}</p>
            </div>

            <button className="w-full py-2 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:text-cyan-400 text-slate-300 text-xs rounded-xl flex items-center justify-center gap-2 transition-colors font-medium">
              <span>Study Resource</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

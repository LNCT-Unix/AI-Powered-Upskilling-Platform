import React, { useState } from 'react';
import { Server, Layout, Check, Sparkles, ArrowRight } from 'lucide-react';

export default function OnboardingScreen({ onComplete }) {
  const [selectedTrack, setSelectedTrack] = useState('backend');
  const [familiarity, setFamiliarity] = useState('some');
  const [studyTime, setStudyTime] = useState(2.5);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      
      {/* Step Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
          STEP 01 / ONBOARDING & PREFERENCES
        </span>
        <h2 className="text-3xl font-black text-white">Which skill track do you want to master?</h2>
        <p className="text-xs text-slate-400">Select your focus area to tailor baseline diagnostic and learning modules.</p>
      </div>

      {/* Track Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Backend Track */}
        <div
          onClick={() => setSelectedTrack('backend')}
          className={`cursor-pointer p-6 rounded-2xl border transition-all ${
            selectedTrack === 'backend'
              ? 'bg-slate-900 border-cyan-400 shadow-cyan-glow'
              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Server className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
              PRIMARY TRACK
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Backend Engineering</h3>
          <p className="text-xs text-slate-400 mb-4">
            REST APIs, PostgreSQL, Redis, System Design, Kafka, JWT Auth & Docker.
          </p>
          <span className="text-[11px] text-cyan-400 font-mono">18,000+ Indian job openings (Naukri & LinkedIn)</span>
        </div>

        {/* UI/UX Track */}
        <div
          onClick={() => setSelectedTrack('uiux')}
          className={`cursor-pointer p-6 rounded-2xl border transition-all ${
            selectedTrack === 'uiux'
              ? 'bg-slate-900 border-cyan-400 shadow-cyan-glow'
              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Layout className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
              DESIGN TRACK
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">UI/UX Product Design</h3>
          <p className="text-xs text-slate-400 mb-4">
            Figma design systems, auto-layout, information architecture, accessibility, & prototyping.
          </p>
          <span className="text-[11px] text-slate-500 font-mono">8,200+ product design & UI openings</span>
        </div>

      </div>

      {/* Skill Level Selection */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h4 className="text-sm font-bold text-white">How familiar are you with this skill?</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'brand', title: 'Brand New', desc: 'Starting from scratch' },
            { id: 'some', title: 'Some Knowledge', desc: 'Built small projects or college coursework' },
            { id: 'experienced', title: 'Experienced', desc: 'Comfortable coding, looking for advanced topics' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFamiliarity(item.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                familiarity === item.id
                  ? 'bg-cyan-500/10 border-cyan-400 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <p className="text-xs font-bold text-white mb-1">{item.title}</p>
              <p className="text-[10px] text-slate-400">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Target Technologies Pills */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
        <h4 className="text-sm font-bold text-white">Target Technologies & Languages</h4>
        <div className="flex flex-wrap gap-2">
          {['Go', 'Node.js / TypeScript', 'Python', 'Java / Spring', 'PostgreSQL', 'Redis', 'Kafka', 'Docker'].map((tech, i) => (
            <span key={i} className="px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5">
              <Check className="w-3 h-3 text-cyan-400" /> {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Slider & Action */}
      <div className="bg-slate-900 border border-cyan-500/20 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-white">Daily Available Study Time</span>
            <span className="text-sm font-mono font-bold text-cyan-400">{studyTime} hrs / day</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="6"
            step="0.5"
            value={studyTime}
            onChange={(e) => setStudyTime(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        <button
          onClick={onComplete}
          className="w-full sm:w-auto px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-cyan-glow transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <span>Start 10-Question Adaptive Test</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}

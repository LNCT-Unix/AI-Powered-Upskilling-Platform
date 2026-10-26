import React, { useState } from 'react';
import { Lock, Mail, Github, Globe, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AuthScreen({ onComplete }) {
  const [tab, setTab] = useState('signin');
  const [role, setRole] = useState('student');

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Left Side - Auth Box */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-8 shadow-cyan-glow flex flex-col justify-between">
          <div>
            {/* Toggle Tabs */}
            <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
              <button
                onClick={() => setTab('signin')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  tab === 'signin' ? 'bg-cyan-500 text-slate-950 shadow-cyan-glow-sm' : 'text-slate-400'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('create')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  tab === 'create' ? 'bg-cyan-500 text-slate-950 shadow-cyan-glow-sm' : 'text-slate-400'
                }`}
              >
                Create Account
              </button>
            </div>

            <h2 className="text-2xl font-black text-white mb-1">
              {tab === 'signin' ? 'Welcome to AI Upskilling Platform' : 'Launch Your Adaptive Path'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              {tab === 'signin'
                ? 'Sign in with College SSO or credentials to enter your adaptive skills dashboard.'
                : 'Measure your baseline and receive an industry-vetted learning roadmap.'}
            </p>

            {/* Role Selectors */}
            {tab === 'create' && (
              <div className="mb-6">
                <span className="text-[10px] uppercase font-mono text-cyan-400 block mb-2">SELECT ROLE</span>
                <div className="grid grid-cols-3 gap-2">
                  {['Student', 'Trainer', 'Institute'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r.toLowerCase())}
                      className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                        role === r.toLowerCase()
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onComplete(); }}>
              {tab === 'create' && (
                <div>
                  <label className="text-[11px] text-slate-300 font-medium block mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue="Aarav Sharma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-300 font-medium block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    defaultValue="aarav.sharma@apex.edu.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-medium block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    defaultValue="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {tab === 'create' && (
                <div className="flex items-start gap-2 pt-1">
                  <input type="checkbox" defaultChecked className="mt-1 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500" />
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Consent to diagnostic skill evaluation in compliance with DPOP Act 2023.
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-cyan-glow transition-all flex items-center justify-center gap-2 mt-4"
              >
                <span>{tab === 'signin' ? 'Sign In & Continue' : 'Create Account & Begin Diagnostic'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><Github className="w-3.5 h-3.5 text-cyan-400" /> GitHub & Repo Sync</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> College SSO Ready</span>
          </div>
        </div>

        {/* Right Side - Feature Showcase (Matching video cards) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
              MULTILINGUAL & ADAPTIVE
            </span>
            <h3 className="text-2xl font-black text-white mt-4 mb-3">Learn in your language</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Master complex technical concepts in English, Hindi, or Hinglish with bilingual faculty lectures and voice-enabled query resolution.
            </p>

            {/* Mock Audio / Subtitle Card */}
            <div className="bg-slate-950 border border-cyan-500/20 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                <span className="text-cyan-400">"How to handle Cache Stampede?"</span>
                <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px]">Hinglish Audio</span>
              </div>
              <p className="text-xs text-slate-400 font-mono bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                "Jab Cache expire hota hai toh thousands of concurrent requests direct database pe hit karte hain. Usse prevent karne ke liye Redis mutex lock apply karein..."
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-xs font-bold text-white">Interactive Adaptive Assessment</p>
                <p className="text-[10px] text-slate-400">10-question dynamic diagnostic</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">v2.4</span>
          </div>
        </div>

      </div>
    </div>
  );
}

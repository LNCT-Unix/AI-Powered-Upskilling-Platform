import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ArrowLeft, Globe, Target, Briefcase, Cpu } from 'lucide-react';
import { TRACK_UUID_MAP, BACKEND_TRACK_ID } from '../services/assessmentService';

const TRACKS = [
  {
    id: 'fullstack',
    icon: Globe,
    title: 'Full-Stack Web Development',
    desc: 'React, Node.js, SQL, system design. Most in-demand for Indian product companies.',
    demand: '8,400+ open roles on Naukri right now',
    salary: '6–22 LPA',
    color: 'bg-indigo-50 border-indigo-200',
    activeColor: 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500',
    iconBg: 'bg-indigo-100 text-indigo-600',
  },
  {
    id: 'backend',
    icon: Target,
    title: 'Backend Systems & Architecture',
    desc: 'Java/Go, distributed systems, databases, APIs. High-paying infra and platform roles.',
    demand: 'Appears in 6 of 10 backend JDs at ₹15 LPA+',
    salary: '8–25 LPA',
    color: 'bg-slate-50 border-slate-200',
    activeColor: 'border-indigo-600 bg-slate-50 ring-2 ring-indigo-500',
    iconBg: 'bg-slate-100 text-slate-600',
  },
  {
    id: 'ai-data',
    icon: Cpu,
    title: 'AI Engineering & Applied ML',
    desc: 'Python, pandas, scikit-learn, PyTorch. Fastest-growing track in India, 2024–25.',
    demand: 'ML roles grew 43% YoY in Bengaluru & Pune',
    salary: '10–30 LPA',
    color: 'bg-violet-50 border-violet-200',
    activeColor: 'border-indigo-600 bg-violet-50 ring-2 ring-indigo-500',
    iconBg: 'bg-violet-100 text-violet-600',
  },
  {
    id: 'devops',
    icon: Briefcase,
    title: 'Cloud Engineering & DevOps',
    desc: 'AWS/GCP, Kubernetes, CI/CD, Terraform. Required at every scaling startup.',
    demand: 'DevOps roles up 61% since 2023 in India',
    salary: '9–28 LPA',
    color: 'bg-emerald-50 border-emerald-200',
    activeColor: 'border-indigo-600 bg-emerald-50 ring-2 ring-indigo-500',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
];

const STEPS = ['Language', 'Track', 'Budget'];

export default function OnboardingPage() {
  const navigate    = useNavigate();
  const [step, setStep]   = useState(0);
  const [lang, setLang]   = useState('en');
  const [trackId, setTrackId] = useState('fullstack');
  const [budget, setBudget]   = useState('60');

  const handleFinish = () => {
    const profile = {
      language: lang,
      trackSlug: trackId,
      trackId: TRACK_UUID_MAP[trackId] || BACKEND_TRACK_ID,
      dailyMinutes: parseInt(budget),
    };
    localStorage.setItem('skillpath_onboarding_profile', JSON.stringify(profile));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f5f3ee' }}>
      <div className="w-full max-w-2xl animate-scale-in">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  i < step  ? 'bg-emerald-500 text-white'
                  : i === step ? 'bg-indigo-600 text-white animate-pulse-ring'
                  : 'bg-slate-200 text-slate-500'
                }`}>
                  {i < step ? <CheckCircle2 size={13} /> : i + 1}
                </span>
                <span className={`text-xs font-semibold hidden sm:block ${i === step ? 'text-slate-900' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-10 transition-all duration-500 ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          {/* Step 0: Language */}
          {step === 0 && (
            <div className="animate-slide-up p-8 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Step 1 of 3</p>
                <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Welcome — choose your language</h1>
                <p className="mt-1 text-sm text-slate-500">You can change this anytime in the top bar.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[['en', 'English', 'Default'], ['hi', 'हिन्दी', 'Hindi'], ['hinglish', 'Hinglish', 'Mixed']].map(([key, label, sub]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLang(key)}
                    className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                      lang === key
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-slate-900 text-sm">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                  </button>
                ))}
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
                >
                  Next <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Track */}
          {step === 1 && (
            <div className="animate-slide-up p-8 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Step 2 of 3</p>
                <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Pick your career track</h1>
                <p className="mt-1 text-sm text-slate-500">Your roadmap, skill graph and job matches will be tailored to this.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {TRACKS.map((track, i) => {
                  const Icon = track.icon;
                  const isSelected = trackId === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setTrackId(track.id)}
                      className={`animate-slide-up rounded-xl border p-4 text-left transition-all duration-200 card-hover ${
                        isSelected ? track.activeColor : `${track.color} hover:border-slate-300`
                      }`}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${track.iconBg} mb-3`}>
                        <Icon size={16} />
                      </span>
                      <p className="font-bold text-slate-900 text-sm leading-snug">{track.title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{track.desc}</p>
                      <p className="mt-2 text-[10px] font-bold text-indigo-600">{track.demand}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Avg. salary: {track.salary}</p>
                    </button>
                  );
                })}
              </div>
              <div className="pt-2 flex items-center justify-between">
                <button type="button" onClick={() => setStep(0)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition">
                  <ArrowLeft size={14} /> Back
                </button>
                <button type="button" onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition">
                  Next <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Budget */}
          {step === 2 && (
            <div className="animate-slide-up p-8 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Step 3 of 3</p>
                <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Your daily study budget</h1>
                <p className="mt-1 text-sm text-slate-500">Your roadmap will be paced to fit this. You can always adjust.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-indigo-600">{budget} min / day</span>
                  <span className="text-xs text-slate-400">
                    ≈ {budget <= 30 ? '4–6' : budget <= 60 ? '6–9' : '9–12'} weeks to complete
                  </span>
                </div>
                <input
                  type="range"
                  min="15" max="120" step="15"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  className="w-full accent-indigo-600 cursor-pointer"
                  aria-label="Daily study time in minutes"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>15 min</span><span>30 min</span><span>45 min</span><span>60 min</span><span>90 min</span><span>120 min</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[['15', 'Light', '4 days / week'], ['45', 'Steady', 'Daily habit'], ['90', 'Intensive', 'Fast-track']].map(([v, label, sub]) => (
                    <button key={v} type="button" onClick={() => setBudget(v)}
                      className={`rounded-xl border p-3 text-center transition-all ${
                        budget === v ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'
                      }`}>
                      <p className="text-sm font-bold text-slate-900">{label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <button type="button" onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition">
                  <ArrowLeft size={14} /> Back
                </button>
                <button type="button" onClick={handleFinish}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-md">
                  Go to Dashboard <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Lock,
  Sparkles,
  Flame,
  Target,
  BookOpen,
  ChevronRight,
  MessageCircle,
  ArrowUpRight,
  ArrowRight,
  Zap,
  TrendingUp,
  Award,
  Calendar,
  Compass,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

/* ── Interactive Skill Graph ───────────────────────────────── */
function DynamicSkillGraph({ skills = [] }) {
  if (skills.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        No skill nodes available. Complete your diagnostic test to generate your live graph.
      </div>
    );
  }

  const nodes = skills.slice(0, 7).map((s, idx) => ({
    ...s,
    x: 65 + (idx % 4) * 135,
    y: idx < 4 ? 65 : 145,
  }));

  return (
    <div className="w-full overflow-x-auto py-2">
      <svg
        viewBox="0 0 580 210"
        className="w-full"
        style={{ minWidth: 440, maxHeight: 195 }}
        aria-label="Skill dependency visualization"
        role="img"
      >
        <defs>
          <linearGradient id="activeNodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="frontierGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eef2ff" />
            <stop offset="100%" stopColor="#e0e7ff" />
          </linearGradient>
        </defs>

        {/* Connector lines between consecutive nodes */}
        {nodes.map((node, i) => {
          if (i === nodes.length - 1) return null;
          const next = nodes[i + 1];
          const isConnectedMastered = node.state === 'MASTERED' && next.state === 'MASTERED';
          return (
            <line
              key={`line-${node.skillId || i}`}
              x1={node.x}
              y1={node.y}
              x2={next.x}
              y2={next.y}
              stroke={isConnectedMastered ? '#4f46e5' : '#cbd5e1'}
              strokeWidth={isConnectedMastered ? '2.5' : '1.5'}
              strokeDasharray={next.state === 'LOCKED' ? '4 4' : undefined}
            />
          );
        })}

        {/* Node circles */}
        {nodes.map((node, i) => {
          const isMastered = node.state === 'MASTERED';
          const isFrontier = node.state === 'FRONTIER';

          const circleColor = isMastered ? 'url(#activeNodeGrad)' : isFrontier ? 'url(#frontierGrad)' : '#ffffff';
          const strokeColor = isMastered ? '#4338ca' : isFrontier ? '#6366f1' : '#e2e8f0';
          const textColor = isMastered ? '#4f46e5' : isFrontier ? '#1e293b' : '#64748b';

          return (
            <g key={node.skillId || `node-${i}`} className="group cursor-pointer">
              {isFrontier && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={26}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="animate-spin"
                  style={{ transformOrigin: `${node.x}px ${node.y}px`, animationDuration: '9s' }}
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={21}
                fill={circleColor}
                stroke={strokeColor}
                strokeWidth={isFrontier ? '2.5' : '1.5'}
                className="transition-all filter drop-shadow-xs group-hover:scale-105"
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
              {isMastered ? (
                <text x={node.x} y={node.y + 5} textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800">
                  ✓
                </text>
              ) : isFrontier ? (
                <text x={node.x} y={node.y + 5} textAnchor="middle" fill="#4f46e5" fontSize="11" fontWeight="800">
                  ⚡
                </text>
              ) : (
                <text x={node.x} y={node.y + 5} textAnchor="middle" fill="#94a3b8" fontSize="11">
                  🔒
                </text>
              )}
              <text
                x={node.x}
                y={node.y + 36}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={textColor}
                fontFamily="Inter, sans-serif"
              >
                {node.name.length > 14 ? `${node.name.slice(0, 13)}…` : node.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Pretty Stat Card matching Landing Page ───────────────── */
function StatCard({ label, value, sub, icon: Icon, badgeBg, iconColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition flex items-center gap-3.5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${badgeBg} ${iconColor} shadow-xs`}>
        <Icon size={19} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-base font-extrabold text-slate-900 truncate leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

/* ─────────────────────────── Dashboard Page ─────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load real assessment results from localStorage
  const assessmentResult = useMemo(() => {
    try {
      const raw = localStorage.getItem('skillpath_assessment_result');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const skills = useMemo(() => {
    return assessmentResult?.skills || [];
  }, [assessmentResult]);

  const masteredSkills = useMemo(() => {
    return skills.filter(s => s.state === 'MASTERED');
  }, [skills]);

  const frontierSkills = useMemo(() => {
    return skills.filter(s => s.state === 'FRONTIER');
  }, [skills]);

  const lockedSkills = useMemo(() => {
    return skills.filter(s => s.state === 'LOCKED');
  }, [skills]);

  const completedCount = masteredSkills.length;
  const totalCount = skills.length;
  const readinessPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const firstName = user?.fullName?.split(' ')[0] || 'Learner';

  // Greeting logic
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const skillsFromReady = frontierSkills.length + lockedSkills.length;
  const nextUpSkill = frontierSkills[0]?.name || (lockedSkills[0]?.name ?? 'Diagnostic CAT');

  return (
    <div className="flex flex-col lg:flex-row min-h-full pb-10">
      {/* ── Main Centre Content ── */}
      <div className="flex-1 min-w-0 p-4 sm:p-7 space-y-6">

        {/* ── Landing Page Themed Hero Welcome Banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100/60 via-indigo-50/70 to-purple-100/60 p-6 sm:p-8 border border-slate-200/70 shadow-xs">
          {/* Subtle decorative circles */}
          <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-yellow-200/40 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-indigo-200/40 blur-xl pointer-events-none" />

          {/* Floating badge for visual flair */}
          <div className="hidden sm:flex absolute right-6 top-6 items-center gap-2 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-100 px-3.5 py-1.5 shadow-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-yellow-400 text-xs">
              ⚡
            </span>
            <span className="text-[11px] font-bold text-slate-800">
              {totalCount > 0 ? `${readinessPct}% Ready` : 'Ready to Calibrate'}
            </span>
          </div>

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-xs border border-slate-200/60 px-3 py-1 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{today}</p>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {greeting}, {firstName}!
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg">
              {totalCount > 0 ? (
                skillsFromReady > 0 ? (
                  <>
                    You are progressing smoothly on your <span className="font-semibold text-slate-900">Full-Stack Developer</span> path.
                    You have <span className="font-bold text-indigo-600">{skillsFromReady} milestone{skillsFromReady !== 1 ? 's' : ''}</span> left to complete full competency.
                  </>
                ) : (
                  <>Congratulations! You have mastered all competencies in your current learning track.</>
                )
              ) : (
                <>Welcome to your personalized learning studio. Start your quick Computerized Adaptive Test (CAT) to diagnose skill gaps and build your optimal roadmap.</>
              )}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {totalCount === 0 ? (
                <Button variant="indigo" onClick={() => navigate('/assessment')}>
                  Start Diagnostic Test <ArrowRight size={15} />
                </Button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/roadmap')}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
                  >
                    Resume Next Skill: {nextUpSkill} <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/assessment')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-slate-200/80 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-white transition cursor-pointer shadow-2xs"
                  >
                    <Flame size={14} className="text-amber-500" /> Retake Diagnostic
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI Stat Cards Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Target Track"
            value="Full-Stack Dev"
            sub="Primary Specialization"
            icon={Target}
            badgeBg="bg-indigo-100"
            iconColor="text-indigo-600"
            onClick={() => navigate('/career')}
          />
          <StatCard
            label="Track Readiness"
            value={`${readinessPct}%`}
            sub={totalCount > 0 ? `${completedCount} of ${totalCount} Mastered` : 'Test pending'}
            icon={BookOpen}
            badgeBg="bg-teal-100"
            iconColor="text-teal-700"
            onClick={() => navigate('/roadmap')}
          />
          <StatCard
            label="Ability Level (θ)"
            value={assessmentResult?.level || 'Pending'}
            sub={assessmentResult ? `θ = ${assessmentResult.theta}` : 'Click to assess'}
            icon={Flame}
            badgeBg="bg-amber-100"
            iconColor="text-amber-600"
            onClick={() => navigate('/assessment')}
          />
          <StatCard
            label="Frontier Skills"
            value={frontierSkills.length > 0 ? `${frontierSkills.length} In Progress` : totalCount > 0 ? 'All Mastered' : '0 Pending'}
            sub={frontierSkills[0]?.name ? `Focus: ${frontierSkills[0].name}` : 'Ready to start'}
            icon={Zap}
            badgeBg="bg-purple-100"
            iconColor="text-purple-600"
            onClick={() => navigate('/roadmap')}
          />
        </div>

        {/* ── Assessment Prompt or Interactive Skill Graph ── */}
        {totalCount === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-7 sm:p-10 shadow-xs text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto shadow-2xs">
              <Sparkles size={26} />
            </div>
            <div className="max-w-md mx-auto">
              <h2 className="text-lg font-extrabold text-slate-900">Calibrate Your Adaptive Learning Graph</h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                octoByte uses Item Response Theory (IRT) and Computerized Adaptive Testing to pinpoint exactly where you should focus next.
              </p>
            </div>
            <div className="pt-2">
              <Button variant="indigo" onClick={() => navigate('/assessment')}>
                Start Diagnostic CAT (10-15 min) <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Interactive Skill Graph ── */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Compass size={14} />
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900">Interactive Skill Graph</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Topological Competency Flow & Dependency Prerequisite Tree</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold flex-wrap">
                  <span className="flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 border border-slate-100">
                    <span className="h-2 w-2 rounded-full bg-indigo-600" /> Mastered ({completedCount})
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-indigo-50/70 px-2.5 py-1 border border-indigo-100 text-indigo-700">
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" /> Frontier ({frontierSkills.length})
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 border border-slate-100 text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-slate-300" /> Locked ({lockedSkills.length})
                  </span>
                </div>
              </div>
              <DynamicSkillGraph skills={skills} />
            </div>

            {/* ── Verified Competencies Grid ── */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Verified Competencies & Frontier Skills</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time status based on your diagnostic answers</p>
                </div>
                <Link
                  to="/graph"
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                >
                  Full Graph View <ArrowUpRight size={13} />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {skills.slice(0, 6).map((skill) => {
                  const isMastered = skill.state === 'MASTERED';
                  const isFrontier = skill.state === 'FRONTIER';
                  return (
                    <div
                      key={skill.skillId || skill.name}
                      className={`flex items-center gap-3.5 rounded-2xl border p-3.5 transition ${
                        isMastered
                          ? 'border-emerald-100 bg-emerald-50/30'
                          : isFrontier
                          ? 'border-indigo-100 bg-indigo-50/30'
                          : 'border-slate-100 bg-slate-50/40'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                          isMastered
                            ? 'bg-emerald-100 text-emerald-700'
                            : isFrontier
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isMastered ? '✓' : isFrontier ? '⚡' : '🔒'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{skill.name}</p>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">{skill.cluster || 'Core'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {isMastered ? 'Mastered in diagnostic' : isFrontier ? 'Next frontier milestone' : 'Prerequisites pending'}
                        </p>
                      </div>
                      {isFrontier && (
                        <button
                          type="button"
                          onClick={() => navigate('/roadmap')}
                          className="rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-indigo-700 transition shrink-0 cursor-pointer shadow-2xs"
                        >
                          Learn
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Right Panel: Learning Path & AI Coach ── */}
      <div className="lg:w-80 xl:w-88 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200/70 p-4 sm:p-6 space-y-6">

        {/* Learning Path Card */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Learning Path</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Tailored to your target role</p>
            </div>
            <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600">
              {completedCount} / {totalCount} Done
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${readinessPct}%` }}
            />
          </div>

          <div className="space-y-2">
            {skills.length > 0 ? (
              skills.slice(0, 5).map((item) => {
                const isMastered = item.state === 'MASTERED';
                const isFrontier = item.state === 'FRONTIER';
                return (
                  <div
                    key={item.skillId || item.name}
                    className={`flex items-center justify-between gap-2.5 rounded-2xl border p-2.5 transition ${
                      isMastered
                        ? 'border-emerald-100 bg-emerald-50/20'
                        : isFrontier
                        ? 'border-indigo-100 bg-indigo-50/30 ring-1 ring-indigo-200/50'
                        : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isMastered ? 'Verified Competency' : isFrontier ? 'Currently Calibrating' : 'Locked'}
                      </p>
                    </div>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isMastered
                          ? 'bg-emerald-100 text-emerald-700'
                          : isFrontier
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isMastered ? '✓' : isFrontier ? '⚡' : '🔒'}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">Complete diagnostic test to unlock modules.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/roadmap')}
            className="mt-4 w-full rounded-full border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            View Full Adaptive Roadmap <ChevronRight size={13} />
          </button>
        </div>

        {/* Weekly Focus Micro Card */}
        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400 text-amber-950 font-bold text-xs shadow-2xs">
              🎯
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Weekly Target</p>
          </div>
          <p className="text-xs font-medium text-amber-950/80 leading-relaxed">
            Master 2 Frontier skills this week to reach <span className="font-bold text-amber-900">{Math.min(readinessPct + 15, 100)}%</span> readiness for junior developer opportunities.
          </p>
        </div>

        {/* AI Learning Coach Pill / CTA */}
        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 text-white shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs text-white">
              <Sparkles size={15} />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-100">AI Learning Coach</p>
          </div>
          <p className="text-xs text-indigo-100 leading-relaxed">
            Stuck on a concept or need tailored code examples? Ask your AI coach for immediate guidance.
          </p>
          <button
            type="button"
            onClick={() => navigate('/assessment')}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition shadow-2xs cursor-pointer"
          >
            <MessageCircle size={14} />
            Ask AI Coach
          </button>
        </div>

      </div>
    </div>
  );
}

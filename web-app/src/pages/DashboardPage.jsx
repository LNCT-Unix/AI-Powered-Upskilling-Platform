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
      <div className="py-12 text-center text-xs text-[#8D8471]">
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
            <stop offset="0%" stopColor="#2FBF8F" />
            <stop offset="100%" stopColor="#1F7A55" />
          </linearGradient>
          <linearGradient id="frontierGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFEEDD" />
            <stop offset="100%" stopColor="#FFF1E2" />
          </linearGradient>
        </defs>

        {/* Connector lines between consecutive nodes */}
        {nodes.map((node, i) => {
          if (i === nodes.length - 1) return null;
          const next = nodes[i + 1];
          const isConnectedMastered = node.state === 'MASTERED' && next.state === 'MASTERED';
          const isConnectedFrontier = next.state === 'FRONTIER';
          return (
            <line
              key={`line-${node.skillId || i}`}
              x1={node.x}
              y1={node.y}
              x2={next.x}
              y2={next.y}
              stroke={isConnectedMastered ? '#2FBF8F' : isConnectedFrontier ? '#FF9838' : '#DCD2BC'}
              strokeWidth={isConnectedMastered ? '2.5' : '1.8'}
              strokeDasharray={!isConnectedMastered ? '5 5' : undefined}
            />
          );
        })}

        {/* Node circles */}
        {nodes.map((node, i) => {
          const isMastered = node.state === 'MASTERED';
          const isFrontier = node.state === 'FRONTIER';

          const circleColor = isMastered ? 'url(#activeNodeGrad)' : isFrontier ? 'url(#frontierGrad)' : '#F7F3E8';
          const strokeColor = isMastered ? '#2FBF8F' : isFrontier ? '#FF9838' : '#E8E0CC';
          const textColor = isMastered ? '#1F7A55' : isFrontier ? '#B45A14' : '#8D8471';

          return (
            <g key={node.skillId || `node-${i}`} className="group cursor-pointer">
              {isFrontier && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={26}
                  fill="none"
                  stroke="#FF9838"
                  strokeWidth="1.6"
                  strokeDasharray="4 4"
                  className="animate-spin"
                  style={{ transformOrigin: `${node.x}px ${node.y}px`, animationDuration: '8s' }}
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={21}
                fill={circleColor}
                stroke={strokeColor}
                strokeWidth={isFrontier ? '2.5' : '1.6'}
                className="transition-all filter drop-shadow-xs group-hover:scale-105"
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
              {isMastered ? (
                <text x={node.x} y={node.y + 5} textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800">
                  ✓
                </text>
              ) : isFrontier ? (
                <text x={node.x} y={node.y + 5} textAnchor="middle" fill="#FF9838" fontSize="12" fontWeight="800">
                  ⚡
                </text>
              ) : (
                <text x={node.x} y={node.y + 5} textAnchor="middle" fill="#8D8471" fontSize="11">
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
      className={`rounded-2xl border border-[#E8E0CC] bg-[#FFFDF7] p-4 shadow-xs hover:shadow-md transition flex items-center gap-3.5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${badgeBg} ${iconColor} shadow-2xs`}>
        <Icon size={19} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8D8471]">{label}</p>
        <p className="text-base font-extrabold text-[#2F2A3E] truncate leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[11px] font-medium text-[#6E6880] mt-0.5 truncate">{sub}</p>}
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFFDF7] via-[#F8F3E8] to-[#EFEAFC]/70 p-6 sm:p-8 border border-[#E8E0CC] shadow-xs">
          {/* Subtle decorative circles */}
          <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#FF9838]/12 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-[#7C5CFA]/12 blur-xl pointer-events-none" />

          {/* Floating badge for visual flair */}
          <div className="hidden sm:flex absolute right-6 top-6 items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-xs border border-[#E8E0CC] px-3.5 py-1.5 shadow-2xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FFEEDD] text-[#FF9838] text-xs font-bold">
              ⚡
            </span>
            <span className="text-[11px] font-bold text-[#2F2A3E]">
              {totalCount > 0 ? `${readinessPct}% Ready` : 'Ready to Calibrate'}
            </span>
          </div>

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-xs border border-[#E8E0CC] px-3 py-1 mb-3 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C5CFA] animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6E6880]">{today}</p>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2F2A3E] tracking-tight leading-tight">
              {greeting}, {firstName}!
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-[#6E6880] leading-relaxed max-w-lg">
              {totalCount > 0 ? (
                skillsFromReady > 0 ? (
                  <>
                    You are progressing smoothly on your <span className="font-semibold text-[#2F2A3E]">Full-Stack Developer</span> path.
                    You have <span className="font-bold text-[#7C5CFA]">{skillsFromReady} milestone{skillsFromReady !== 1 ? 's' : ''}</span> left to complete full competency.
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
                <Button variant="primary" onClick={() => navigate('/assessment')}>
                  Start Diagnostic Test <ArrowRight size={15} />
                </Button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/roadmap')}
                    className="inline-flex items-center gap-2 rounded-full bg-[#7C5CFA] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#7C5CFA]/20 hover:bg-[#6244E8] transition cursor-pointer"
                  >
                    Resume Next Skill: {nextUpSkill} <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/assessment')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-[#E8E0CC] px-4 py-2.5 text-xs font-bold text-[#2F2A3E] hover:bg-[#F7F3E8] transition cursor-pointer shadow-2xs"
                  >
                    <Flame size={14} className="text-[#FF9838]" /> Retake Diagnostic
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
            badgeBg="bg-[#EFEAFC]"
            iconColor="text-[#7C5CFA]"
            onClick={() => navigate('/career')}
          />
          <StatCard
            label="Track Readiness"
            value={`${readinessPct}%`}
            sub={totalCount > 0 ? `${completedCount} of ${totalCount} Mastered` : 'Test pending'}
            icon={BookOpen}
            badgeBg="bg-[#E7F8EF]"
            iconColor="text-[#2FBF8F]"
            onClick={() => navigate('/roadmap')}
          />
          <StatCard
            label="Ability Level (θ)"
            value={assessmentResult?.level || 'Pending'}
            sub={assessmentResult ? `θ = ${assessmentResult.theta}` : 'Click to assess'}
            icon={Flame}
            badgeBg="bg-[#FFEEDD]"
            iconColor="text-[#FF9838]"
            onClick={() => navigate('/assessment')}
          />
          <StatCard
            label="Frontier Skills"
            value={frontierSkills.length > 0 ? `${frontierSkills.length} In Progress` : totalCount > 0 ? 'All Mastered' : '0 Pending'}
            sub={frontierSkills[0]?.name ? `Focus: ${frontierSkills[0].name}` : 'Ready to start'}
            icon={Zap}
            badgeBg="bg-[#F0EBFF]"
            iconColor="text-[#7C5CFA]"
            onClick={() => navigate('/roadmap')}
          />
        </div>

        {/* ── Assessment Prompt or Interactive Skill Graph ── */}
        {totalCount === 0 ? (
          <div className="rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-7 sm:p-10 shadow-xs text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#EFEAFC] border border-[#7C5CFA]/20 text-[#7C5CFA] mx-auto shadow-2xs">
              <Sparkles size={26} />
            </div>
            <div className="max-w-md mx-auto">
              <h2 className="text-lg font-extrabold text-[#2F2A3E]">Calibrate Your Adaptive Learning Graph</h2>
              <p className="text-xs text-[#6E6880] mt-1.5 leading-relaxed">
                octoByte uses Item Response Theory (IRT) and Computerized Adaptive Testing to pinpoint exactly where you should focus next.
              </p>
            </div>
            <div className="pt-2">
              <Button variant="primary" onClick={() => navigate('/assessment')}>
                Start Diagnostic CAT (10-15 min) <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Interactive Skill Graph ── */}
            <div className="rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EFEAFC] text-[#7C5CFA]">
                      <Compass size={14} />
                    </span>
                    <h2 className="text-base font-extrabold text-[#2F2A3E]">Interactive Skill Graph</h2>
                  </div>
                  <p className="text-xs text-[#6E6880] mt-0.5">Topological Competency Flow &amp; Dependency Prerequisite Tree</p>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] font-bold flex-wrap">
                  <span className="flex items-center gap-1.5 rounded-full bg-[#E7F8EF] px-2.5 py-1 border border-[#BFE9D2] text-[#1F7A55]">
                    <span className="h-2 w-2 rounded-full bg-[#2FBF8F]" /> Mastered ({completedCount})
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-[#FFEEDD] px-2.5 py-1 border border-[#FFD9B8] text-[#B45A14]">
                    <span className="h-2 w-2 rounded-full bg-[#FF9838] animate-pulse" /> Frontier ({frontierSkills.length})
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-[#F7F3E8] px-2.5 py-1 border border-[#E8E0CC] text-[#8D8471]">
                    <span className="h-2 w-2 rounded-full bg-[#C6BBA2]" /> Locked ({lockedSkills.length})
                  </span>
                </div>
              </div>
              <DynamicSkillGraph skills={skills} />
            </div>

            {/* ── Verified Competencies Grid ── */}
            <div className="rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-[#2F2A3E]">Verified Competencies &amp; Frontier Skills</h2>
                  <p className="text-xs text-[#6E6880] mt-0.5">Real-time status based on your diagnostic answers</p>
                </div>
                <Link
                  to="/graph"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#7C5CFA] hover:text-[#6244E8] transition"
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
                          ? 'border-[#BFE9D2] bg-[#E7F8EF]/60'
                          : isFrontier
                          ? 'border-[#FFD9B8] bg-[#FFF1E2]/70 ring-1 ring-[#FF9838]/20'
                          : 'border-[#E8E0CC] bg-[#F7F3E8]/60'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                          isMastered
                            ? 'bg-[#2FBF8F] text-white shadow-2xs'
                            : isFrontier
                            ? 'bg-[#FF9838] text-white shadow-2xs'
                            : 'bg-[#E8E0CC] text-[#8D8471]'
                        }`}
                      >
                        {isMastered ? '✓' : isFrontier ? '⚡' : '🔒'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-[#2F2A3E] truncate">{skill.name}</p>
                          <span className="text-[10px] font-semibold text-[#8D8471] shrink-0">{skill.cluster || 'Core'}</span>
                        </div>
                        <p className="text-[11px] text-[#6E6880] mt-0.5">
                          {isMastered ? 'Mastered in diagnostic' : isFrontier ? 'Next frontier milestone' : 'Prerequisites pending'}
                        </p>
                      </div>
                      {isFrontier && (
                        <button
                          type="button"
                          onClick={() => navigate('/roadmap')}
                          className="rounded-full bg-[#7C5CFA] px-3 py-1 text-[10px] font-bold text-white hover:bg-[#6244E8] transition shrink-0 cursor-pointer shadow-2xs"
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
      <div className="lg:w-80 xl:w-88 shrink-0 border-t lg:border-t-0 lg:border-l border-[#E8E0CC] p-4 sm:p-6 space-y-6">

        {/* Learning Path Card */}
        <div className="rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="text-sm font-extrabold text-[#2F2A3E]">Learning Path</h2>
              <p className="text-[11px] text-[#8D8471] mt-0.5">Tailored to your target role</p>
            </div>
            <span className="rounded-full bg-[#EFEAFC] border border-[#7C5CFA]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#7C5CFA]">
              {completedCount} / {totalCount} Done
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-[#E8E0CC] overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C5CFA] to-[#FF9838] transition-all duration-500"
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
                        ? 'border-[#BFE9D2] bg-[#E7F8EF]/40'
                        : isFrontier
                        ? 'border-[#FFD9B8] bg-[#FFF1E2]/70 ring-1 ring-[#FF9838]/30'
                        : 'border-[#E8E0CC] bg-[#FFFDF7]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#2F2A3E] truncate">{item.name}</p>
                      <p className="text-[10px] text-[#8D8471] mt-0.5">
                        {isMastered ? 'Verified Competency' : isFrontier ? 'Currently Calibrating' : 'Locked'}
                      </p>
                    </div>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isMastered
                          ? 'bg-[#2FBF8F] text-white shadow-2xs'
                          : isFrontier
                          ? 'bg-[#FF9838] text-white shadow-2xs'
                          : 'bg-[#E8E0CC] text-[#8D8471]'
                      }`}
                    >
                      {isMastered ? '✓' : isFrontier ? '⚡' : '🔒'}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#8D8471] py-3 text-center">Complete diagnostic test to unlock modules.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/roadmap')}
            className="mt-4 w-full rounded-full border border-[#E8E0CC] bg-white py-2.5 text-xs font-bold text-[#2F2A3E] hover:bg-[#F7F3E8] transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            View Full Adaptive Roadmap <ChevronRight size={13} />
          </button>
        </div>

        {/* Weekly Focus Micro Card */}
        <div className="rounded-3xl border border-[#FFD9B8] bg-gradient-to-br from-[#FFEEDD] to-[#FFF3CF]/60 p-5 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FF9838] text-white font-bold text-xs shadow-2xs">
              🎯
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-[#B45A14]">Weekly Target</p>
          </div>
          <p className="text-xs font-medium text-[#6A3906] leading-relaxed">
            Master 2 Frontier skills this week to reach <span className="font-bold text-[#B45A14]">{Math.min(readinessPct + 15, 100)}%</span> readiness for junior developer opportunities.
          </p>
        </div>

        {/* AI Learning Coach Pill / CTA */}
        <div className="rounded-3xl border border-[#7C5CFA]/30 bg-gradient-to-br from-[#6C4BEF] via-[#7C5CFA] to-[#8F74F2] p-5 text-white shadow-md shadow-[#7C5CFA]/20 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs text-white">
              <Sparkles size={15} />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-white">AI Learning Coach</p>
          </div>
          <p className="text-xs text-[#EFEAFC] leading-relaxed">
            Stuck on a concept or need tailored code examples? Ask your AI coach for immediate guidance.
          </p>
          <button
            type="button"
            onClick={() => navigate('/assessment')}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#7C5CFA] hover:bg-[#FAF8F5] transition shadow-2xs cursor-pointer"
          >
            <MessageCircle size={14} />
            Ask AI Coach
          </button>
        </div>

      </div>
    </div>
  );
}

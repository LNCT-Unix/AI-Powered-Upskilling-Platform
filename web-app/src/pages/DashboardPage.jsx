import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Lock,
  Sparkles,
  Flame,
  Target,
  BookOpen,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  Zap,
  TrendingUp,
  Award,
  Compass,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import InteractiveSkillGraph from '../components/graph/InteractiveSkillGraph';
import UserAvatar from '../components/ui/UserAvatar';

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
  const [assessmentResult, setAssessmentResult] = useState(() => {
    try {
      const raw = localStorage.getItem('skillpath_assessment_result');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const skills = useMemo(() => {
    return assessmentResult?.skills || [];
  }, [assessmentResult]);

  const readySkills = useMemo(() => {
    return skills.filter(s => s.state === 'MASTERED' || s.status === 'unlocked' || s.state === 'READY_TO_LEARN');
  }, [skills]);

  const lockedSkills = useMemo(() => {
    return skills.filter(s => s.state === 'LOCKED' || (!['MASTERED', 'unlocked', 'READY_TO_LEARN'].includes(s.state) && s.status !== 'unlocked'));
  }, [skills]);

  const completedCount = readySkills.length;
  const totalCount = skills.length;
  const readinessPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const firstName = user?.fullName?.split(' ')[0] || 'Learner';

  // Greeting logic
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const skillsFromReady = lockedSkills.length;
  const nextUpSkill = lockedSkills[0]?.name ?? 'Diagnostic CAT';

  return (
    <div className="flex flex-col lg:flex-row min-h-full pb-10">
      {/* ── Main Centre Content ── */}
      <div className="flex-1 min-w-0 p-4 sm:p-7 space-y-6">

        {/* ── Landing Page Themed Hero Welcome Banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFFDF7] via-[#F8F3E8] to-[#EFEAFC]/70 p-5 sm:p-8 border border-[#E8E0CC] shadow-xs">
          {/* Subtle decorative circles */}
          <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#FF9838]/12 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-[#7C5CFA]/12 blur-xl pointer-events-none" />

          <div className="relative z-10 max-w-xl">

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2F2A3E] tracking-tight leading-tight">
              <span className="hidden lg:inline-flex items-center mr-3">
                <UserAvatar user={user} size="md" className="border-2 border-white shadow-xs" />
              </span>
              <span>{greeting}, {firstName}!</span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-[#6E6880] leading-relaxed max-w-lg">
              {totalCount > 0 ? (
                skillsFromReady > 0 ? (
                  <>
                    You are progressing smoothly on your <span className="font-semibold text-[#2F2A3E]">Full-Stack Developer</span> path.
                    You have <span className="font-bold text-[#7C5CFA]">{skillsFromReady} milestone{skillsFromReady !== 1 ? 's' : ''}</span> left to complete full competency.
                  </>
                ) : (
                  <>Congratulations! You are ready to learn all competencies in your current learning track.</>
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
            sub={totalCount > 0 ? `${completedCount} of ${totalCount} Ready to Learn` : 'Test pending'}
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
            label="Ready to Learn"
            value={completedCount > 0 ? `${completedCount} Active` : totalCount > 0 ? 'All Locked' : '0 Pending'}
            sub={readySkills[0]?.name ? `Focus: ${readySkills[0].name}` : 'Ready to start'}
            icon={Zap}
            badgeBg="bg-[#F0EBFF]"
            iconColor="text-[#7C5CFA]"
            onClick={() => navigate('/graph')}
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
              </div>
              <InteractiveSkillGraph
                skills={skills}
                height={480}
                showHeader={false}
                onSkillUnlocked={() => {
                  try {
                    const raw = localStorage.getItem('skillpath_assessment_result');
                    if (raw) setAssessmentResult(JSON.parse(raw));
                  } catch {
                    // ignore
                  }
                }}
              />
            </div>

            {/* ── Verified Competencies Grid ── */}
            <div className="rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-[#2F2A3E]">Verified Competencies</h2>
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
                  const isReady = skill.state === 'MASTERED' || skill.status === 'unlocked' || skill.state === 'READY_TO_LEARN';
                  return (
                    <div
                      key={skill.skillId || skill.name}
                      className={`flex items-center gap-3.5 rounded-2xl border p-3.5 transition ${
                        isReady
                          ? 'border-[#BFE9D2] bg-[#E7F8EF]/60'
                          : 'border-[#E8E0CC] bg-[#F7F3E8]/60'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                          isReady
                            ? 'bg-[#2FBF8F] text-white shadow-2xs'
                            : 'bg-[#E8E0CC] text-[#8D8471]'
                        }`}
                      >
                        {isReady ? '✓' : '🔒'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-[#2F2A3E] truncate">{skill.name}</p>
                          <span className="text-[10px] font-semibold text-[#8D8471] shrink-0">{skill.cluster || 'Core'}</span>
                        </div>
                        <p className="text-[11px] text-[#6E6880] mt-0.5">
                          {isReady ? 'Ready to learn' : 'Prerequisites pending'}
                        </p>
                      </div>
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
                const isReady = item.state === 'MASTERED' || item.status === 'unlocked' || item.state === 'READY_TO_LEARN';
                return (
                  <div
                    key={item.skillId || item.name}
                    className={`flex items-center justify-between gap-2.5 rounded-2xl border p-2.5 transition ${
                      isReady
                        ? 'border-[#BFE9D2] bg-[#E7F8EF]/40'
                        : 'border-[#E8E0CC] bg-[#FFFDF7]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#2F2A3E] truncate">{item.name}</p>
                      <p className="text-[10px] text-[#8D8471] mt-0.5">
                        {isReady ? 'Ready to Learn' : 'Locked'}
                      </p>
                    </div>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isReady
                          ? 'bg-[#2FBF8F] text-white shadow-2xs'
                          : 'bg-[#E8E0CC] text-[#8D8471]'
                      }`}
                    >
                      {isReady ? '✓' : '🔒'}
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

      </div>
    </div>
  );
}

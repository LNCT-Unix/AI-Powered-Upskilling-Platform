import { Link, useOutletContext } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Award,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Copy,
  GraduationCap,
  KeyRound,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';
import {
  getAverageDemoScore,
  getCohortStats,
  getProgressTier,
} from '../../data/mentorDemoData';
import {
  DemoPill,
  MentorStatCard,
  ProgressBar,
} from './MentorShared';
import { progressTone } from './mentorUtils';

const cardClass = 'rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] shadow-xs';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function MentorOverview() {
  const { mentor, students, achievements, uniqueKey, showToast } = useOutletContext();

  const stats = getCohortStats(students, achievements);
  const averageScore = getAverageDemoScore(students);
  const firstName = mentor.fullName.replace('Dr. ', '').split(' ')[0];

  const topStudents = [...students].sort((a, b) => b.progress - a.progress).slice(0, 5);
  const recentAchievements = [...achievements]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  const progressBuckets = ['Advanced', 'On Track', 'Needs Attention'].map((tier) => ({
    tier,
    count: students.filter((student) => getProgressTier(student.progress) === tier).length,
  }));

  const handleCopyKey = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(uniqueKey);
      showToast('Demo mentor key copied to clipboard.');
    } catch {
      showToast('Could not access the clipboard. Open My Unique Key to copy it.', 'error');
    }
  };

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-7">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-[#E8E0CC] bg-gradient-to-br from-[#FFFDF7] via-[#F8F3E8] to-[#EFEAFC]/70 p-5 shadow-xs sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#FF9838]/12 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#7C5CFA]/12 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <UserAvatar
              user={mentor}
              size="lg"
              className="hidden shrink-0 border-2 border-white shadow-sm sm:inline-flex"
            />
            <div className="min-w-0">
              <DemoPill>Mentor demo overview</DemoPill>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#2F2A3E] sm:text-3xl">
                {getGreeting()}, {firstName}!
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-[#6E6880] sm:text-sm">
                Your cohort is {stats.averageProgress}% through their learning paths. You have{' '}
                <span className="font-bold text-[#7C5CFA]">{stats.activeStudents} active students</span>{' '}
                and <span className="font-bold text-[#2F2A3E]">{recentAchievements.length} recent skill wins</span> to celebrate.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/mentor/students"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#7C5CFA] px-4 py-2 text-[11px] font-bold text-white shadow-md shadow-[#7C5CFA]/20 transition hover:bg-[#6244E8]"
                >
                  View My Students <ArrowRight size={13} />
                </Link>
                <Link
                  to="/mentor/key"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E0CC] bg-white/95 px-4 py-2 text-[11px] font-bold text-[#2F2A3E] shadow-2xs transition hover:bg-[#F7F3E8]"
                >
                  <KeyRound size={13} className="text-[#7C5CFA]" /> Share mentor key
                </Link>
              </div>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2.5 sm:gap-3">
            <div className="rounded-2xl border border-[#E8E0CC] bg-white/90 p-3 shadow-2xs">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#8D8471]">
                Avg. demo score
              </p>
              <p className="mt-1 text-xl font-extrabold text-[#2F2A3E]">{averageScore}%</p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-[#138A63]">
                <TrendingUp size={11} /> Cohort average
              </p>
            </div>
            <div className="rounded-2xl border border-[#E8E0CC] bg-white/90 p-3 shadow-2xs">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#8D8471]">
                Cohort progress
              </p>
              <p className="mt-1 text-xl font-extrabold text-[#2F2A3E]">{stats.averageProgress}%</p>
              <ProgressBar
                value={stats.averageProgress}
                tone="purple"
                className="mt-1.5 h-1"
                label="Cohort average progress"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MentorStatCard
          label="Total Students"
          value={stats.totalStudents}
          detail="Across 3 learning tracks"
          icon={Users}
          tint="purple"
          trend="+2 this month"
        />
        <MentorStatCard
          label="Tests Taken"
          value={stats.testsTaken}
          detail="Adaptive assessments"
          icon={ClipboardCheck}
          tint="orange"
          trend="+12 this week"
        />
        <MentorStatCard
          label="Skills Achieved"
          value={stats.skillsAchieved}
          detail="Verified skill milestones"
          icon={Award}
          tint="green"
          trend="+4 new"
        />
        <MentorStatCard
          label="Active Students"
          value={stats.activeStudents}
          detail={`${Math.round((stats.activeStudents / stats.totalStudents) * 100)}% currently learning`}
          icon={Activity}
          tint="blue"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Top students */}
        <section className={`${cardClass} xl:col-span-2`}>
          <div className="flex items-center justify-between gap-3 border-b border-[#E8E0CC] px-5 py-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#2F2A3E]">Students to watch</h2>
              <p className="mt-0.5 text-[11px] text-[#8D8471]">
                Highest learning progress across your demo cohort
              </p>
            </div>
            <Link
              to="/mentor/students"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C5CFA] transition hover:text-[#6244E8]"
            >
              View all <ChevronRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-[#F0E9DA]">
            {topStudents.map((student, index) => (
              <div
                key={student.id}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#FDF9EE] sm:px-5"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#F7F3E8] text-[10px] font-extrabold text-[#8D8471]">
                  {index + 1}
                </span>
                <UserAvatar user={{ fullName: student.name }} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-extrabold text-[#2F2A3E]">{student.name}</p>
                    <span className="shrink-0 text-[10px] font-bold tabular-nums text-[#6E6880]">
                      {student.progress}%
                    </span>
                  </div>
                  <p className="truncate text-[10px] text-[#8D8471]">@{student.username}</p>
                  <ProgressBar
                    value={student.progress}
                    tone={progressTone(student.progress)}
                    className="mt-1.5 h-1"
                    label={`${student.name} progress`}
                  />
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-[10px] font-bold text-[#2F2A3E]">{student.testsTaken} tests</p>
                  <p className="text-[9px] text-[#8D8471]">{student.skillsAchieved} skills</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent achievements */}
        <section className={cardClass}>
          <div className="flex items-center justify-between gap-3 border-b border-[#E8E0CC] px-5 py-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#2F2A3E]">Recent achievements</h2>
              <p className="mt-0.5 text-[11px] text-[#8D8471]">Latest verified skill wins</p>
            </div>
            <Link
              to="/mentor/skills"
              className="grid h-7 w-7 place-items-center rounded-lg border border-[#E8E0CC] text-[#8D8471] transition hover:bg-[#EFEAFC] hover:text-[#7C5CFA]"
              aria-label="View all achievements"
            >
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-2.5 p-4">
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-start gap-2.5 rounded-2xl border border-[#F0E9DA] bg-[#FDF9EE] p-2.5"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-[#C8EFDD] bg-[#E7F8EF] text-[#138A63]">
                  <Award size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-extrabold text-[#2F2A3E]">
                    {achievement.skill}
                  </p>
                  <p className="truncate text-[10px] text-[#8D8471]">
                    {achievement.studentName} · {achievement.proficiency}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[9px] font-semibold text-[#8D8471]">
                    <CalendarDays size={10} /> {achievement.dateLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E8E0CC] px-4 py-3">
            <p className="text-[10px] text-[#8D8471]">
              Illustrative demo achievements only. No student records are stored.
            </p>
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Cohort health */}
        <section className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#2F2A3E]">Cohort progress snapshot</h2>
              <p className="mt-0.5 text-[11px] text-[#8D8471]">
                Learning progress bands across {stats.totalStudents} demo students
              </p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#E4D7FF] bg-[#EFEAFC] text-[#7C5CFA]">
              <GraduationCap size={17} />
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {progressBuckets.map((bucket) => {
              const percentage = Math.round((bucket.count / stats.totalStudents) * 100);
              const tone =
                bucket.tier === 'Advanced' ? 'green' : bucket.tier === 'On Track' ? 'purple' : 'amber';
              return (
                <div key={bucket.tier}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#4C4661]">{bucket.tier}</span>
                    <span className="font-semibold tabular-nums text-[#8D8471]">
                      {bucket.count} students · {percentage}%
                    </span>
                  </div>
                  <ProgressBar
                    value={percentage}
                    tone={tone}
                    label={`${bucket.tier} students`}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[#FFD9B8] bg-[#FFF6EC] p-3 text-[11px] text-[#9A5B16]">
            <Sparkles size={14} className="mt-0.5 shrink-0" />
            <p>
              Focus next on the <strong>{progressBuckets[2].count} students</strong> who need attention.
              Their demo progress is below 50%.
            </p>
          </div>
        </section>

        {/* Mentor key quick card */}
        <section className="relative overflow-hidden rounded-3xl border border-[#4A3A94] bg-gradient-to-br from-[#33277A] via-[#3D2C86] to-[#6244E8] p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-[#FF9838]/20 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider">
                <KeyRound size={11} /> Mentor key
              </span>
              <Link
                to="/mentor/key"
                className="text-[10px] font-bold text-white/75 transition hover:text-white"
              >
                Manage key
              </Link>
            </div>

            <h2 className="mt-3 text-lg font-extrabold">Invite students to your cohort</h2>
            <p className="mt-1 max-w-md text-[11px] leading-relaxed text-white/70">
              Share this demo key so students can connect with you. It exists only in this browser
              session and is not saved to a database.
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center justify-between gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-xs">
                <span className="font-mono text-sm font-extrabold tracking-[0.18em]">{uniqueKey}</span>
                <span className="rounded-full bg-[#FFC93C] px-2 py-0.5 text-[9px] font-extrabold text-[#2F2A3E]">
                  DEMO
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyKey}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-[11px] font-extrabold text-[#3D2C86] shadow-md transition hover:bg-[#F7F3E8]"
              >
                <Copy size={13} /> Copy key
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

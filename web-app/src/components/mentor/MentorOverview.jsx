import { useEffect, useState } from 'react';
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
  TrendingUp,
  Users,
} from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';
import {
  MentorStatCard,
  ProgressBar,
} from './MentorShared';
import { progressTone } from './mentorUtils';
import { mentorService } from '../../services/mentorService';

const cardClass = 'rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] shadow-xs';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function MentorOverview() {
  const { mentor, uniqueKey, showToast } = useOutletContext();
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    let mounted = true;
    mentorService.getOverview()
      .then((res) => {
        if (mounted && res?.data) {
          setOverview(res.data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const stats = overview?.stats || {
    totalStudents: 0,
    activeStudents: 0,
    skillsAchieved: 0,
    testsTaken: 0,
    averageProgress: 0,
  };
  const averageScore = overview?.stats?.averageScore ?? 0;
  const firstName = (mentor?.fullName || 'Mentor').replace('Dr. ', '').split(' ')[0];

  const topStudents = overview?.topStudents || [];
  const recentAchievements = overview?.recentAchievements || [];

  const progressBuckets = overview?.progressBuckets && overview.progressBuckets.length > 0
    ? overview.progressBuckets.map((b) => ({ tier: b.label || b.tier, count: b.count }))
    : [
        { tier: 'Advanced', count: 0 },
        { tier: 'On Track', count: 0 },
        { tier: 'Needs Attention', count: 0 },
      ];

  const activeKey = overview?.mentorKey || uniqueKey;

  const handleCopyKey = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(activeKey);
      showToast('Mentor key copied to clipboard.');
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
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E4D7FF] bg-[#EFEAFC] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#6244E8]">
                Cohort Overview
              </span>
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
                Avg. score
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
          detail="Active cohort learners"
          icon={Users}
          tint="purple"
        />
        <MentorStatCard
          label="Tests Taken"
          value={stats.testsTaken}
          detail="Completed & in progress"
          icon={ClipboardCheck}
          tint="amber"
        />
        <MentorStatCard
          label="Skills Achieved"
          value={stats.skillsAchieved}
          detail="Verified mastery milestones"
          icon={Award}
          tint="green"
        />
        <MentorStatCard
          label="Active Students"
          value={stats.activeStudents}
          detail="Active within 30 days"
          icon={Activity}
          tint="blue"
        />
      </section>

      {/* Main split */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Top students */}
        <section className={`${cardClass} xl:col-span-2`}>
          <div className="flex items-center justify-between gap-3 border-b border-[#E8E0CC] px-5 py-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#2F2A3E]">Top cohort performers</h2>
              <p className="mt-0.5 text-[11px] text-[#8D8471]">
                Highest overall learning progress in your cohort
              </p>
            </div>
            <Link
              to="/mentor/students"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#7C5CFA] transition hover:text-[#5F3CE6]"
            >
              All students <ChevronRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-[#F0E9DA] p-2">
            {topStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8D8471]">
                No student activity recorded yet. Share your mentor key to connect students.
              </div>
            ) : (
              topStudents.map((student, index) => (
                <div
                  key={student.id || student.username}
                  className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-[#FDF9EE]"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#F7F3E8] text-[11px] font-extrabold text-[#8D8471]">
                    #{index + 1}
                  </span>
                  <UserAvatar user={{ fullName: student.name }} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-extrabold text-[#2F2A3E]">
                        {student.name}
                      </p>
                      <span className="text-xs font-bold tabular-nums text-[#7C5CFA]">
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
                </div>
              ))
            )}
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
            {recentAchievements.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8D8471]">
                No verified achievements yet in your cohort.
              </div>
            ) : (
              recentAchievements.map((achievement) => (
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
                      <CalendarDays size={10} /> {achievement.date ? new Date(achievement.date).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                </div>
              ))
            )}
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
                Learning progress bands across {stats.totalStudents} students
              </p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#E4D7FF] bg-[#EFEAFC] text-[#7C5CFA]">
              <GraduationCap size={17} />
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {progressBuckets.map((bucket) => {
              const count = bucket.count || 0;
              const total = stats.totalStudents || 1;
              const percentage = stats.totalStudents > 0 ? Math.round((count / total) * 100) : 0;
              const tone =
                bucket.tier === 'Advanced' ? 'green' : bucket.tier === 'On Track' ? 'purple' : 'amber';
              return (
                <div key={bucket.tier}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#4C4661]">{bucket.tier}</span>
                    <span className="font-semibold tabular-nums text-[#8D8471]">
                      {count} students · {percentage}%
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
              Share this key so students can connect with your cohort.
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center justify-between gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-xs">
                <span className="font-mono text-sm font-extrabold tracking-[0.18em]">{activeKey || 'NO-KEY-YET'}</span>
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

import { Link, useOutletContext } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Gauge,
  TrendingUp,
  Users,
} from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';
import Badge from '../ui/Badge';
import {
  DEMO_RECENT_ACTIVITY,
  DEMO_TEST_SUMMARY,
  DEMO_WEEKLY_ACTIVITY,
  getAverageDemoScore,
  getCohortStats,
  getProgressTier,
} from '../../data/mentorDemoData';
import {
  MentorPageHeader,
  MentorStatCard,
  ProgressBar,
} from './MentorShared';
import { progressTone } from './mentorUtils';

const cardClass = 'rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] shadow-xs';

function progressBadgeVariant(label) {
  if (label === 'Advanced') return 'emerald';
  if (label === 'On Track') return 'indigo';
  return 'amber';
}

export default function TestAnalytics() {
  const { students } = useOutletContext();
  const cohort = getCohortStats(students);
  const totalTests = cohort.testsTaken;
  const averageScore = getAverageDemoScore(students);
  const completedTests = totalTests - DEMO_TEST_SUMMARY.inProgressTests;

  const weeklyTotal = DEMO_WEEKLY_ACTIVITY.reduce((sum, item) => sum + item.value, 0);
  const weeklyMax = Math.max(...DEMO_WEEKLY_ACTIVITY.map((item) => item.value));

  const rankedStudents = [...students].sort((a, b) => {
    if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
    return b.testsTaken - a.testsTaken;
  });

  const bands = ['Advanced', 'On Track', 'Needs Attention'].map((tier) => ({
    tier,
    count: students.filter((student) => getProgressTier(student.progress) === tier).length,
  }));

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-7">
      <MentorPageHeader
        eyebrow="Assessment intelligence"
        title="Test Analytics"
        description="A frontend analytics snapshot of cohort test activity, average scores, and student performance. Bars and statistics are generated from the centralized mentor demo data."
        icon={BarChart3}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E0CC] bg-white px-3 py-1.5 text-[11px] font-bold text-[#6E6880] shadow-2xs">
            <CalendarDays size={13} className="text-[#7C5CFA]" /> Updated for demo
          </span>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MentorStatCard
          label="Total Tests Taken"
          value={totalTests}
          detail={`Across ${students.length} demo students`}
          icon={ClipboardCheck}
          tint="purple"
        />
        <MentorStatCard
          label="Average Demo Score"
          value={`${averageScore}%`}
          detail="Weighted by tests taken"
          icon={TrendingUp}
          tint="green"
          trend="+4.2%"
        />
        <MentorStatCard
          label="Completed Tests"
          value={completedTests}
          detail={`${DEMO_TEST_SUMMARY.completionRate}% completion rate`}
          icon={CheckCircle2}
          tint="blue"
        />
        <MentorStatCard
          label="In-Progress Tests"
          value={DEMO_TEST_SUMMARY.inProgressTests}
          detail={`Avg. duration ${DEMO_TEST_SUMMARY.averageDuration}`}
          icon={Clock}
          tint="orange"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Weekly activity */}
        <section className={`${cardClass} p-5 xl:col-span-2`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-[#2F2A3E]">Tests this week</h2>
              <p className="mt-0.5 text-[11px] text-[#8D8471]">
                {weeklyTotal} assessments completed across the last seven demo days
              </p>
            </div>
            <span className="inline-flex items-center gap-1 self-start rounded-full border border-[#C8EFDD] bg-[#E7F8EF] px-2.5 py-1 text-[10px] font-bold text-[#138A63]">
              <TrendingUp size={11} /> Healthy activity
            </span>
          </div>

          <div className="mt-5 flex h-44 items-end gap-2 sm:gap-4" role="img" aria-label="Weekly test activity bar chart">
            {DEMO_WEEKLY_ACTIVITY.map((item) => {
              const height = Math.max(12, Math.round((item.value / weeklyMax) * 100));
              return (
                <div key={item.day} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1.5">
                  <span className="text-[9px] font-extrabold tabular-nums text-[#6E6880]">
                    {item.value}
                  </span>
                  <div className="flex w-full flex-1 items-end overflow-hidden rounded-t-xl bg-[#F7F3E8]">
                    <div
                      className="w-full rounded-t-xl bg-gradient-to-t from-[#7C5CFA] via-[#9B82FB] to-[#C4B5FD] transition-all duration-500 group-hover:opacity-90"
                      style={{ height: `${height}%` }}
                      title={`${item.day}: ${item.value} tests`}
                    />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8D8471]">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#F0E9DA] pt-3">
            {bands.map((band) => (
              <span
                key={band.tier}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E0CC] bg-[#FDF9EE] px-2.5 py-1 text-[10px] font-semibold text-[#6E6880]"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    band.tier === 'Advanced'
                      ? 'bg-[#2FBF8F]'
                      : band.tier === 'On Track'
                        ? 'bg-[#7C5CFA]'
                        : 'bg-[#FF9838]'
                  }`}
                />
                {band.tier}: <strong className="text-[#2F2A3E]">{band.count}</strong>
              </span>
            ))}
          </div>
        </section>

        {/* Recent activity */}
        <section className={cardClass}>
          <div className="flex items-center justify-between gap-3 border-b border-[#E8E0CC] px-5 py-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#2F2A3E]">Recent assessment activity</h2>
              <p className="mt-0.5 text-[11px] text-[#8D8471]">Latest demo cohort events</p>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#E4D7FF] bg-[#EFEAFC] text-[#7C5CFA]">
              <Activity size={15} />
            </span>
          </div>

          <div className="max-h-[360px] divide-y divide-[#F0E9DA] overflow-y-auto">
            {DEMO_RECENT_ACTIVITY.map((activity) => (
              <div key={activity.id} className="flex items-start gap-2.5 px-4 py-3">
                <UserAvatar user={{ fullName: activity.studentName }} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-extrabold text-[#2F2A3E]">
                    {activity.studentName}
                  </p>
                  <p className="truncate text-[10px] text-[#6E6880]">{activity.testName}</p>
                  <p className="mt-0.5 text-[9px] text-[#8D8471]">
                    {activity.date} · {activity.time}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge
                    variant={activity.status === 'Completed' ? 'emerald' : 'amber'}
                    size="sm"
                  >
                    {activity.status === 'Completed' ? `${activity.score}%` : 'In Progress'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Student-wise performance */}
      <section className={cardClass}>
        <div className="flex flex-col gap-2 border-b border-[#E8E0CC] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-[#2F2A3E]">Student-wise test performance</h2>
            <p className="mt-0.5 text-[11px] text-[#8D8471]">
              Scores and test counts from {students.length} illustrative student records
            </p>
          </div>
          <Link
            to="/mentor/students"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C5CFA] transition hover:text-[#6244E8]"
          >
            <Users size={13} /> Open student directory
          </Link>
        </div>

        <div className="hidden max-h-[460px] overflow-auto md:block">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#FDF9EE]">
              <tr className="border-b border-[#E8E0CC]">
                {['Student', 'Tests Taken', 'Average Score', 'Learning Progress', 'Band'].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-4 py-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8D8471]"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E9DA]">
              {rankedStudents.map((student) => (
                <tr key={student.id} className="transition hover:bg-[#FDF9EE]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={{ fullName: student.name }} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold text-[#2F2A3E]">
                          {student.name}
                        </p>
                        <p className="truncate text-[10px] text-[#8D8471]">
                          @{student.username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] font-bold tabular-nums text-[#6E6880]">
                    {student.testsTaken}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#E8E0CC] bg-white px-2.5 py-1 text-[10px] font-extrabold tabular-nums text-[#2F2A3E]">
                      <Gauge size={11} className="text-[#7C5CFA]" /> {student.averageScore}%
                    </span>
                  </td>
                  <td className="min-w-[180px] px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold tabular-nums text-[#6E6880]">
                        {student.progress}%
                      </span>
                      <span className="text-[9px] text-[#8D8471]">{student.progressLabel}</span>
                    </div>
                    <ProgressBar
                      value={student.progress}
                      tone={progressTone(student.progress)}
                      className="mt-1.5"
                      label={`${student.name} learning progress`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={progressBadgeVariant(student.progressLabel)} size="sm">
                      {student.progressLabel}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile performance list */}
        <div className="max-h-[520px] divide-y divide-[#F0E9DA] overflow-y-auto md:hidden">
          {rankedStudents.map((student) => (
            <div key={student.id} className="flex items-start gap-3 px-4 py-3">
              <UserAvatar user={{ fullName: student.name }} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] font-extrabold text-[#2F2A3E]">{student.name}</p>
                  <span className="shrink-0 text-[10px] font-extrabold text-[#2F2A3E]">
                    {student.averageScore}%
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[9px] text-[#8D8471]">
                  <span>@{student.username}</span>
                  <span>{student.testsTaken} tests</span>
                </div>
                <ProgressBar
                  value={student.progress}
                  tone={progressTone(student.progress)}
                  className="mt-1.5"
                  label={`${student.name} progress`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="rounded-2xl border border-dashed border-[#D8CCAE] bg-[#FDF9EE] px-4 py-3 text-[10px] leading-relaxed text-[#8D8471]">
        Analytics are calculated from the centralized frontend demo records. They are not official
        assessment results and do not read from the platform database.
      </p>
    </div>
  );
}

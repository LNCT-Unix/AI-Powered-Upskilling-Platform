import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  TrendingUp,
} from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';
import Badge from '../ui/Badge';
import {
  MentorPageHeader,
  MentorStatCard,
} from './MentorShared';
import { mentorService } from '../../services/mentorService';

const cardClass = 'rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] shadow-xs';

function progressBadgeVariant(label) {
  if (label === 'Advanced') return 'emerald';
  if (label === 'On Track') return 'indigo';
  return 'amber';
}

const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TestAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [activities, setActivities] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      mentorService.getTestAnalytics(),
      mentorService.getRecentActivity({ limit: 8 }),
    ]).then(([analyticsRes, activityRes]) => {
      if (mounted) {
        if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data) {
          setAnalytics(analyticsRes.value.data);
        }
        if (activityRes.status === 'fulfilled' && activityRes.value?.data) {
          setActivities(activityRes.value.data);
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const totals = analytics?.totals || {
    testsTaken: 0,
    averageScore: 0,
    completedTests: 0,
    inProgressTests: 0,
    completionRate: 0,
    averageDurationSeconds: 0,
  };

  const weeklyActivity = analytics?.weeklyActivity && analytics.weeklyActivity.length > 0
    ? analytics.weeklyActivity
    : DEFAULT_DAYS.map((day) => ({ day, value: 0 }));

  const weeklyTotal = weeklyActivity.reduce((sum, item) => sum + item.value, 0);
  const weeklyMax = Math.max(1, ...weeklyActivity.map((item) => item.value));

  const rankedStudents = analytics?.students || [];

  const bands = analytics?.progressBands && analytics.progressBands.length > 0
    ? analytics.progressBands.map((b) => ({ tier: b.label || b.tier, count: b.count }))
    : [
        { tier: 'Advanced', count: 0 },
        { tier: 'On Track', count: 0 },
        { tier: 'Needs Attention', count: 0 },
      ];

  const recentList = activities || [];

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-7">
      <MentorPageHeader
        eyebrow="Assessment intelligence"
        title="Test Analytics"
        description="A cohort analytics snapshot of test activity, average scores, and student performance."
        icon={BarChart3}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E0CC] bg-white px-3 py-1.5 text-[11px] font-bold text-[#6E6880] shadow-2xs">
            <CalendarDays size={13} className="text-[#7C5CFA]" /> Live Analytics
          </span>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MentorStatCard
          label="Total Tests Taken"
          value={totals.testsTaken}
          detail="All attempts by cohort"
          icon={ClipboardCheck}
          tint="purple"
        />
        <MentorStatCard
          label="Average Score"
          value={`${totals.averageScore}%`}
          detail="Across all assessments"
          icon={TrendingUp}
          tint="green"
        />
        <MentorStatCard
          label="Completion Rate"
          value={`${totals.completionRate}%`}
          detail={`${totals.completedTests} finished tests`}
          icon={CheckCircle2}
          tint="blue"
        />
        <MentorStatCard
          label="Avg. Duration"
          value={totals.averageDurationSeconds ? `${Math.round(totals.averageDurationSeconds / 60)} min` : '0 min'}
          detail="Time per assessment"
          icon={Clock}
          tint="amber"
        />
      </section>

      {/* Charts split */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Weekly test volume */}
        <section className={`${cardClass} p-5 xl:col-span-2`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-[#2F2A3E]">Weekly test volume</h2>
              <p className="mt-0.5 text-[11px] text-[#8D8471]">
                {weeklyTotal} assessments submitted this week
              </p>
            </div>
            <span className="inline-flex items-center gap-1 self-start rounded-full bg-[#E7F8EF] px-2.5 py-1 text-[10px] font-extrabold text-[#138A63]">
              <TrendingUp size={11} /> Healthy activity
            </span>
          </div>

          <div className="mt-5 flex h-44 items-end gap-2 sm:gap-4" role="img" aria-label="Weekly test activity bar chart">
            {weeklyActivity.map((item) => {
              const height = weeklyMax > 0 && item.value > 0
                ? Math.max(12, Math.round((item.value / weeklyMax) * 100))
                : 6;
              return (
                <div key={item.date || item.day} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1.5">
                  <span className="text-[9px] font-extrabold tabular-nums text-[#6E6880]">
                    {item.value}
                  </span>
                  <div className="flex w-full flex-1 items-end overflow-hidden rounded-t-xl bg-[#F7F3E8]">
                    <div
                      className="w-full rounded-t-xl bg-gradient-to-t from-[#7C5CFA] via-[#9B82FB] to-[#C4B5FD] transition-all duration-500 hover:opacity-90"
                      style={{ height: `${height}%` }}
                      title={`${item.day} (${item.date || ''}): ${item.value} tests`}
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
              <p className="mt-0.5 text-[11px] text-[#8D8471]">Latest cohort test events</p>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#E4D7FF] bg-[#EFEAFC] text-[#7C5CFA]">
              <Activity size={15} />
            </span>
          </div>

          <div className="max-h-[360px] divide-y divide-[#F0E9DA] overflow-y-auto">
            {recentList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8D8471]">
                No recent assessment activity recorded yet.
              </div>
            ) : (
              recentList.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2.5 px-4 py-3">
                  <UserAvatar user={{ fullName: activity.studentName }} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-extrabold text-[#2F2A3E]">
                      {activity.studentName}
                    </p>
                    <p className="truncate text-[10px] text-[#6E6880]">{activity.testName}</p>
                    <p className="mt-0.5 text-[9px] text-[#8D8471]">
                      {activity.occurredAt ? new Date(activity.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (activity.time || 'Recent')}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge
                      variant={activity.status === 'COMPLETED' || activity.status === 'Completed' ? 'emerald' : 'amber'}
                      size="sm"
                    >
                      {activity.score !== null && activity.score !== undefined ? `${activity.score}%` : 'In Progress'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Student analytics ranking */}
      <section className={cardClass}>
        <div className="flex items-center justify-between border-b border-[#E8E0CC] px-5 py-4">
          <div>
            <h2 className="text-sm font-extrabold text-[#2F2A3E]">Cohort test ranking</h2>
            <p className="mt-0.5 text-[11px] text-[#8D8471]">
              Ranked by average test score and tests completed
            </p>
          </div>
          <Link
            to="/mentor/students"
            className="text-xs font-bold text-[#7C5CFA] hover:text-[#5F3CE6]"
          >
            Manage students →
          </Link>
        </div>

        <div className="overflow-x-auto">
          {rankedStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8D8471]">
              No student assessment records found.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E8E0CC] bg-[#FDF9EE] text-[10px] font-extrabold uppercase tracking-wider text-[#8D8471]">
                <tr>
                  <th className="px-5 py-3">Rank</th>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Track</th>
                  <th className="px-5 py-3">Tests Taken</th>
                  <th className="px-5 py-3">Average Score</th>
                  <th className="px-5 py-3">Learning Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E9DA]">
                {rankedStudents.map((student, index) => (
                  <tr key={student.id} className="transition hover:bg-[#FDF9EE]">
                    <td className="px-5 py-3 font-extrabold text-[#8D8471]">#{index + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar user={{ fullName: student.name }} size="sm" />
                        <div>
                          <p className="font-extrabold text-[#2F2A3E]">{student.name}</p>
                          <p className="text-[10px] text-[#8D8471]">@{student.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[#6E6880]">{student.track}</td>
                    <td className="px-5 py-3 font-bold text-[#2F2A3E]">{student.testsTaken}</td>
                    <td className="px-5 py-3 font-mono font-bold text-[#7C5CFA]">
                      {student.averageScore}%
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={progressBadgeVariant(student.progressLabel)} size="sm">
                        {student.progressLabel}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

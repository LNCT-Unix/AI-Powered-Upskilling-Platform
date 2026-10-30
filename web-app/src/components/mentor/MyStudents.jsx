import { useCallback, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Award,
  BookOpen,
  ClipboardCheck,
  Clock,
  Eye,
  Mail,
  Search,
  SearchX,
  SlidersHorizontal,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import {
  getStudentAchievements,
  getStudentTestHistory,
} from '../../data/mentorDemoData';
import {
  MentorEmptyState,
  MentorModal,
  MentorPageHeader,
  MiniStat,
  ProgressBar,
} from './MentorShared';
import { progressTone } from './mentorUtils';

const PROGRESS_OPTIONS = ['All progress', 'Advanced', 'On Track', 'Needs Attention'];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'tests-desc', label: 'Tests taken (high → low)' },
  { value: 'progress-desc', label: 'Progress (high → low)' },
  { value: 'progress-asc', label: 'Progress (low → high)' },
  { value: 'recent', label: 'Recently active' },
];

function progressBadgeVariant(label) {
  if (label === 'Advanced') return 'emerald';
  if (label === 'On Track') return 'indigo';
  return 'amber';
}

export default function MyStudents() {
  const { students, achievements } = useOutletContext();
  const [query, setQuery] = useState('');
  const [progressFilter, setProgressFilter] = useState('All progress');
  const [sortBy, setSortBy] = useState('name');
  const [selectedId, setSelectedId] = useState(null);

  const selectedStudent = students.find((student) => student.id === selectedId) || null;

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const result = students.filter((student) => {
      const matchesQuery =
        !normalizedQuery ||
        student.name.toLowerCase().includes(normalizedQuery) ||
        student.username.toLowerCase().includes(normalizedQuery);
      const matchesProgress =
        progressFilter === 'All progress' || student.progressLabel === progressFilter;
      return matchesQuery && matchesProgress;
    });

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'tests-desc':
          return b.testsTaken - a.testsTaken;
        case 'progress-desc':
          return b.progress - a.progress;
        case 'progress-asc':
          return a.progress - b.progress;
        case 'recent':
          return a.lastActiveDays - b.lastActiveDays;
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [students, query, progressFilter, sortBy]);

  const closeDetails = useCallback(() => setSelectedId(null), []);

  const hasFilters = query.trim().length > 0 || progressFilter !== 'All progress';
  const resetFilters = () => {
    setQuery('');
    setProgressFilter('All progress');
    setSortBy('name');
  };

  const openStudent = (student) => setSelectedId(student.id);

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-7">
      <MentorPageHeader
        eyebrow="Cohort directory"
        title="My Students"
        description="Search, filter, and inspect the progress of students connected to your mentor demo. Every profile below is illustrative sample data."
        icon={Users}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E0CC] bg-white px-3 py-1.5 text-[11px] font-bold text-[#6E6880] shadow-2xs">
            <Users size={13} className="text-[#7C5CFA]" /> {students.length} demo students
          </span>
        }
      />

      {/* Search & filters */}
      <section className="rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-3 shadow-xs sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="student-search" className="sr-only">
              Search students by name or username
            </label>
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A79FBE]"
              aria-hidden="true"
            />
            <input
              id="student-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by student name or username…"
              className="w-full rounded-2xl border border-[#E8E0CC] bg-white py-2.5 pl-10 pr-10 text-xs text-[#2F2A3E] outline-none transition placeholder:text-[#B4ACC6] focus:border-[#7C5CFA] focus:ring-2 focus:ring-[#EFEAFC]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#A79FBE] transition hover:bg-[#F7F3E8] hover:text-[#2F2A3E]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <label htmlFor="progress-filter" className="sr-only">
                Filter by learning progress
              </label>
              <SlidersHorizontal
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8D8471]"
                aria-hidden="true"
              />
              <select
                id="progress-filter"
                value={progressFilter}
                onChange={(event) => setProgressFilter(event.target.value)}
                className="appearance-none rounded-2xl border border-[#E8E0CC] bg-white py-2.5 pl-8 pr-8 text-[11px] font-semibold text-[#4C4661] outline-none transition focus:border-[#7C5CFA] focus:ring-2 focus:ring-[#EFEAFC]"
              >
                {PROGRESS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sort-students" className="sr-only">
                Sort students
              </label>
              <select
                id="sort-students"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="appearance-none rounded-2xl border border-[#E8E0CC] bg-white px-3 py-2.5 text-[11px] font-semibold text-[#4C4661] outline-none transition focus:border-[#7C5CFA] focus:ring-2 focus:ring-[#EFEAFC]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-2xl border border-[#E8E0CC] bg-[#F7F3E8] px-3 py-2.5 text-[11px] font-bold text-[#6E6880] transition hover:bg-[#EFEAFC] hover:text-[#7C5CFA]"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <p className="mt-2.5 px-1 text-[10px] font-semibold text-[#8D8471]">
          Showing {filteredStudents.length} of {students.length} students
          {progressFilter !== 'All progress' ? ` · ${progressFilter}` : ''}
        </p>
      </section>

      {filteredStudents.length === 0 ? (
        <MentorEmptyState
          icon={SearchX}
          title="No students match your filters"
          description="Try a different name, username, or progress band. You can also reset all filters to see the full demo cohort."
          action={
            <Button variant="primary" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <section className="hidden overflow-hidden rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] shadow-xs md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#E8E0CC] bg-[#FDF9EE]">
                    {['Student', 'Username', 'Skills Achieved', 'Tests Taken', 'Learning Progress', 'Last Active', ''].map(
                      (heading) => (
                        <th
                          key={heading || 'actions'}
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
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() => openStudent(student)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openStudent(student);
                        }
                      }}
                      tabIndex={0}
                      className="group cursor-pointer transition hover:bg-[#FDF9EE] focus:bg-[#FDF9EE] focus:outline-none"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={{ fullName: student.name }} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-extrabold text-[#2F2A3E]">
                              {student.name}
                            </p>
                            <p className="truncate text-[10px] text-[#8D8471]">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-semibold text-[#6E6880]">
                        @{student.username}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#C8EFDD] bg-[#E7F8EF] px-2 py-0.5 text-[10px] font-extrabold text-[#138A63]">
                          <Award size={11} /> {student.skillsAchieved}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-bold tabular-nums text-[#2F2A3E]">
                        {student.testsTaken}
                      </td>
                      <td className="min-w-[170px] px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant={progressBadgeVariant(student.progressLabel)}
                            size="sm"
                          >
                            {student.progressLabel}
                          </Badge>
                          <span className="text-[10px] font-bold tabular-nums text-[#6E6880]">
                            {student.progress}%
                          </span>
                        </div>
                        <ProgressBar
                          value={student.progress}
                          tone={progressTone(student.progress)}
                          className="mt-1.5"
                          label={`${student.name} learning progress`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#6E6880]">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              student.active ? 'bg-[#2FBF8F]' : 'bg-[#C9C2B4]'
                            }`}
                          />
                          {student.lastActive}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openStudent(student);
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-[#E8E0CC] bg-white px-3 py-1.5 text-[10px] font-bold text-[#6E6880] transition hover:border-[#7C5CFA]/40 hover:bg-[#EFEAFC] hover:text-[#7C5CFA]"
                          aria-label={`View details for ${student.name}`}
                        >
                          <Eye size={12} /> View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Mobile cards */}
          <section className="space-y-3 md:hidden">
            {filteredStudents.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => openStudent(student)}
                className="w-full rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-4 text-left shadow-xs transition active:scale-[0.99]"
              >
                <div className="flex items-start gap-3">
                  <UserAvatar user={{ fullName: student.name }} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold text-[#2F2A3E]">{student.name}</p>
                        <p className="truncate text-[10px] text-[#8D8471]">@{student.username}</p>
                      </div>
                      <Badge variant={progressBadgeVariant(student.progressLabel)} size="sm">
                        {student.progressLabel}
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-[#8D8471]">
                      <span>{student.progress}% complete</span>
                      <span>{student.testsTaken} tests</span>
                    </div>
                    <ProgressBar
                      value={student.progress}
                      tone={progressTone(student.progress)}
                      className="mt-1.5"
                      label={`${student.name} learning progress`}
                    />
                    <div className="mt-2 flex items-center justify-between text-[9px] text-[#8D8471]">
                      <span className="inline-flex items-center gap-1">
                        <Award size={10} /> {student.skillsAchieved} skills
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={10} /> {student.lastActive}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </section>
        </>
      )}

      <StudentDetailsModal
        student={selectedStudent}
        achievements={selectedStudent ? getStudentAchievements(selectedStudent.id, achievements) : []}
        onClose={closeDetails}
      />
    </div>
  );
}

/* ───────────────────────── Student details dialog ───────────────────────── */
function StudentDetailsModal({ student, achievements, onClose }) {
  const open = Boolean(student);

  if (!student) {
    return <MentorModal open={false} onClose={onClose} title="Student details" />;
  }

  const testHistory = getStudentTestHistory(student);

  return (
    <MentorModal
      open={open}
      onClose={onClose}
      title={student.name}
      subtitle={`@${student.username} · ${student.track}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <span className="hidden items-center gap-1 text-[10px] font-semibold text-[#8D8471] sm:flex">
            <Eye size={12} /> Demo profile · not saved
          </span>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#E8E0CC] bg-[#FDF9EE] p-4 sm:flex-row sm:items-center">
          <UserAvatar user={{ fullName: student.name }} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-[#2F2A3E]">{student.name}</h3>
              <Badge variant={progressBadgeVariant(student.progressLabel)} size="sm">
                {student.progressLabel}
              </Badge>
              <Badge variant={student.active ? 'emerald' : 'neutral'} size="sm">
                {student.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#6E6880]">
              <Mail size={12} /> {student.email}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#8D8471]">
              <BookOpen size={12} /> {student.track} · Joined {student.joinedAt}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <MiniStat label="Progress" value={`${student.progress}%`} icon={TrendingUp} />
          <MiniStat label="Tests" value={student.testsTaken} icon={ClipboardCheck} />
          <MiniStat label="Avg. score" value={`${student.averageScore}%`} icon={Award} />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-bold text-[#4C4661]">Learning progress</span>
            <span className="font-semibold tabular-nums text-[#8D8471]">{student.progress}%</span>
          </div>
          <ProgressBar
            value={student.progress}
            tone={progressTone(student.progress)}
            label={`${student.name} progress`}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-[#2F2A3E]">Achieved skills</h4>
            <span className="text-[10px] font-semibold text-[#8D8471]">
              {achievements.length} verified
            </span>
          </div>
          {achievements.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {achievements.map((achievement) => (
                <span
                  key={achievement.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D8CCAE] bg-[#F7F3E8] px-3 py-1.5 text-[10px] font-bold text-[#4C4661]"
                >
                  <Award size={12} className="text-[#FF9838]" />
                  {achievement.skill}
                  <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] text-[#7C5CFA]">
                    {achievement.proficiency}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-[#D8CCAE] bg-white px-3 py-4 text-center text-[11px] text-[#8D8471]">
              No verified skills yet in this demo cohort.
            </p>
          )}
        </div>

        <div>
          <h4 className="mb-2 text-xs font-extrabold text-[#2F2A3E]">Recent test performance</h4>
          <div className="overflow-hidden rounded-2xl border border-[#E8E0CC]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E8E0CC] bg-[#FDF9EE]">
                  <th className="px-3 py-2 text-[9px] font-extrabold uppercase tracking-wider text-[#8D8471]">
                    Assessment
                  </th>
                  <th className="px-3 py-2 text-[9px] font-extrabold uppercase tracking-wider text-[#8D8471]">
                    Score
                  </th>
                  <th className="px-3 py-2 text-[9px] font-extrabold uppercase tracking-wider text-[#8D8471]">
                    Status
                  </th>
                  <th className="hidden px-3 py-2 text-[9px] font-extrabold uppercase tracking-wider text-[#8D8471] sm:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E9DA]">
                {testHistory.map((test) => (
                  <tr key={`${test.name}-${test.date}`}>
                    <td className="px-3 py-2 text-[11px] font-bold text-[#2F2A3E]">{test.name}</td>
                    <td className="px-3 py-2 text-[11px] font-semibold tabular-nums text-[#6E6880]">
                      {test.score === null ? '—' : `${test.score}%`}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={test.status === 'Completed' ? 'emerald' : 'amber'}
                        size="sm"
                      >
                        {test.status}
                      </Badge>
                    </td>
                    <td className="hidden px-3 py-2 text-[10px] text-[#8D8471] sm:table-cell">
                      {test.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[10px] leading-relaxed text-[#8D8471]">
          This student profile, test performance, and achievements are illustrative frontend demo
          data. No records are read from or written to the backend.
        </p>
      </div>
    </MentorModal>
  );
}

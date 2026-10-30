import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  ClipboardCheck,
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
  MentorEmptyState,
  MentorModal,
  MentorPageHeader,
  MiniStat,
  ProgressBar,
} from './MentorShared';
import { progressTone } from './mentorUtils';
import { mentorService } from '../../services/mentorService';

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
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [progressFilter, setProgressFilter] = useState('All progress');
  const [sortBy, setSortBy] = useState('name');
  const [selectedId, setSelectedId] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);

  useEffect(() => {
    let mounted = true;
    mentorService.getStudents({
      q: query,
      progressBand: progressFilter,
      sort: sortBy,
      page: 0,
      size: 50,
    })
      .then((res) => {
        if (mounted && res?.data?.content) {
          setStudents(res.data.content);
        }
      })
      .catch(() => {
        if (mounted) {
          setStudents([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [query, progressFilter, sortBy]);

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
          return (a.lastActiveDays || 0) - (b.lastActiveDays || 0);
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });
  }, [students, query, progressFilter, sortBy]);

  const openStudent = async (student) => {
    setSelectedId(student.id);
    try {
      const res = await mentorService.getStudentDetail(student.id);
      if (res?.data) {
        setStudentDetail(res.data);
      }
    } catch {
      // Keep selected
    }
  };

  const closeDetails = useCallback(() => {
    setSelectedId(null);
    setStudentDetail(null);
  }, []);

  const hasFilters = query.trim().length > 0 || progressFilter !== 'All progress';
  const resetFilters = () => {
    setQuery('');
    setProgressFilter('All progress');
    setSortBy('name');
  };

  const selectedStudent = studentDetail?.student
    || students.find((s) => String(s.id) === String(selectedId))
    || null;

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-7">
      <MentorPageHeader
        eyebrow="Cohort directory"
        title="My Students"
        description="Inspect cohort progress, search and filter students, and open any profile for test history and verified milestones."
        icon={Users}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E0CC] bg-white px-3 py-1.5 text-[11px] font-bold text-[#6E6880] shadow-2xs">
            <Users size={13} className="text-[#7C5CFA]" />
            {filteredStudents.length} of {students.length} students
          </span>
        }
      />

      {/* Filter toolbar */}
      <section className="flex flex-col gap-3 rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D8471]"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or username (e.g. Aarav, priya.verma)…"
            className="h-10 w-full rounded-2xl border border-[#E8E0CC] bg-white pl-9 pr-9 text-xs font-semibold text-[#2F2A3E] placeholder-[#B6AD9A] transition focus:border-[#7C5CFA] focus:outline-hidden focus:ring-2 focus:ring-[#7C5CFA]/15"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D8471] transition hover:text-[#2F2A3E]"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Progress filter pills */}
          <div className="flex flex-wrap gap-1 rounded-2xl border border-[#E8E0CC] bg-white p-1">
            {PROGRESS_OPTIONS.map((option) => {
              const active = progressFilter === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setProgressFilter(option)}
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                    active
                      ? 'bg-[#7C5CFA] text-white shadow-2xs'
                      : 'text-[#6E6880] hover:bg-[#F7F3E8] hover:text-[#2F2A3E]'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-[#E8E0CC] bg-white px-3 py-1.5 text-xs">
            <SlidersHorizontal size={13} className="text-[#8D8471]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort students"
              className="bg-transparent text-[11px] font-bold text-[#2F2A3E] focus:outline-hidden"
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
              className="rounded-2xl border border-[#E8E0CC] bg-white px-3 py-2 text-[11px] font-bold text-[#8D8471] transition hover:bg-[#F7F3E8] hover:text-[#2F2A3E]"
            >
              Reset
            </button>
          )}
        </div>
      </section>

      {/* Results grid */}
      {filteredStudents.length > 0 ? (
        <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onOpen={() => openStudent(student)}
            />
          ))}
        </section>
      ) : (
        <MentorEmptyState
          icon={SearchX}
          title={students.length === 0 ? "No students in your cohort yet" : "No students match your filters"}
          description={students.length === 0 ? "Share your mentor key to invite students to your cohort." : "Try broadening your search term or selecting 'All progress'."}
          action={
            hasFilters ? (
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />
      )}

      {/* Detail modal */}
      <StudentDetailModal
        student={selectedStudent}
        achievements={studentDetail?.achievements || []}
        testHistory={studentDetail?.testHistory || []}
        onClose={closeDetails}
      />
    </div>
  );
}

function StudentCard({ student, onOpen }) {
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group flex flex-col justify-between rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-[#7C5CFA] hover:shadow-md cursor-pointer"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <UserAvatar user={{ fullName: student.name }} size="md" />
          <Badge variant={progressBadgeVariant(student.progressLabel)} size="sm">
            {student.progressLabel}
          </Badge>
        </div>

        <h3 className="mt-3 truncate text-sm font-extrabold text-[#2F2A3E] group-hover:text-[#7C5CFA]">
          {student.name}
        </h3>
        <p className="truncate text-[10px] text-[#8D8471]">@{student.username}</p>

        <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#6E6880]">
          <BookOpen size={11} className="shrink-0 text-[#B6AD9A]" />
          <span className="truncate">{student.track}</span>
        </p>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="font-bold text-[#6E6880]">Progress</span>
            <span className="font-extrabold tabular-nums text-[#2F2A3E]">{student.progress}%</span>
          </div>
          <ProgressBar
            value={student.progress}
            tone={progressTone(student.progress)}
            label={`${student.name} progress`}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#F0E9DA] pt-3 text-[10px]">
        <span className="flex items-center gap-1 font-semibold text-[#8D8471]">
          <ClipboardCheck size={12} /> {student.testsTaken} tests
        </span>
        <span className="flex items-center gap-1 font-semibold text-[#8D8471]">
          <Award size={12} /> {student.skillsAchieved} skills
        </span>
      </div>
    </div>
  );
}

function StudentDetailModal({ student, achievements, testHistory, onClose }) {
  if (!student) return null;

  return (
    <MentorModal
      open={Boolean(student)}
      onClose={onClose}
      title={student.name}
      subtitle={`@${student.username} · ${student.track}`}
      size="lg"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
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
              <BookOpen size={12} /> {student.track} · Joined {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString() : '2026'}
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <MiniStat
            label="Learning Progress"
            value={`${student.progress}%`}
            icon={TrendingUp}
            tint="purple"
          />
          <MiniStat
            label="Tests Completed"
            value={student.testsTaken}
            icon={ClipboardCheck}
            tint="amber"
          />
          <MiniStat
            label="Verified Skills"
            value={student.skillsAchieved}
            icon={Award}
            tint="green"
          />
        </div>

        {/* Test history */}
        <div>
          <h4 className="text-xs font-extrabold text-[#2F2A3E]">Assessment history</h4>
          <p className="mt-0.5 text-[10px] text-[#8D8471]">
            Recent adaptive tests and module quizzes
          </p>

          <div className="mt-2.5 space-y-2">
            {testHistory && testHistory.length > 0 ? (
              testHistory.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-[#E8E0CC] bg-[#FFFDF7] p-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#2F2A3E]">{item.name}</p>
                    <p className="text-[10px] text-[#8D8471]">
                      {item.date ? new Date(item.date).toLocaleDateString() : 'Recent'} · {item.status}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-[#7C5CFA]">
                    {item.score}%
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-[#E8E0CC] p-4 text-center text-xs text-[#8D8471]">
                No assessments taken yet.
              </p>
            )}
          </div>
        </div>

        {/* Verified skills */}
        <div>
          <h4 className="text-xs font-extrabold text-[#2F2A3E]">Verified skills</h4>
          <p className="mt-0.5 text-[10px] text-[#8D8471]">
            Skills earned via verified diagnostic assessments
          </p>

          <div className="mt-2.5 space-y-2">
            {achievements && achievements.length > 0 ? (
              achievements.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-[#E8E0CC] bg-[#FFFDF7] p-2.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#E7F8EF] text-[#138A63]">
                      <Award size={13} />
                    </span>
                    <div>
                      <p className="font-bold text-[#2F2A3E]">{item.skill}</p>
                      <p className="text-[10px] text-[#8D8471]">
                        {item.date ? new Date(item.date).toLocaleDateString() : 'Recent'} · {item.category || item.track}
                      </p>
                    </div>
                  </div>
                  <Badge variant="emerald" size="sm">
                    {item.proficiency}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-[#E8E0CC] p-4 text-center text-xs text-[#8D8471]">
                No verified skills recorded yet for this student.
              </p>
            )}
          </div>
        </div>
      </div>
    </MentorModal>
  );
}

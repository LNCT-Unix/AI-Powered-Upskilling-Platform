import { useEffect, useMemo, useState } from 'react';
import {
  Atom,
  Award,
  BrainCircuit,
  Code2,
  Database,
  Lightbulb,
  Network,
  Search,
  SearchX,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import Badge from '../ui/Badge';
import {
  MentorEmptyState,
  MentorPageHeader,
  MentorStatCard,
  ProgressBar,
} from './MentorShared';
import { progressTone } from './mentorUtils';
import { mentorService } from '../../services/mentorService';

const CATEGORY_META = {
  Programming: {
    icon: Code2,
    tile: 'border-[#E4D7FF] bg-[#EFEAFC] text-[#7C5CFA]',
    bar: 'from-[#7C5CFA] to-[#A78BFA]',
  },
  'Data Structures': {
    icon: Network,
    tile: 'border-[#D3E6FF] bg-[#E8F1FF] text-[#2563EB]',
    bar: 'from-[#3B82F6] to-[#93C5FD]',
  },
  Frontend: {
    icon: Atom,
    tile: 'border-[#FFD9B8] bg-[#FFEEDD] text-[#C06A14]',
    bar: 'from-[#FF9838] to-[#FFC93C]',
  },
  Databases: {
    icon: Database,
    tile: 'border-[#C8EFDD] bg-[#E7F8EF] text-[#138A63]',
    bar: 'from-[#2FBF8F] to-[#6EE7B7]',
  },
  'AI & ML': {
    icon: BrainCircuit,
    tile: 'border-rose-200 bg-rose-50 text-rose-600',
    bar: 'from-rose-500 to-rose-300',
  },
  'Problem Solving': {
    icon: Lightbulb,
    tile: 'border-[#FDE68A] bg-[#FEF9C3] text-[#A16207]',
    bar: 'from-[#EAB308] to-[#FDE047]',
  },
};

function proficiencyVariant(proficiency) {
  const p = (proficiency || '').toLowerCase();
  if (p === 'expert') return 'emerald';
  if (p === 'advanced') return 'indigo';
  if (p === 'intermediate') return 'amber';
  return 'neutral';
}

export default function AchievedSkills() {
  const [achievements, setAchievements] = useState([]);
  const [facets, setFacets] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All categories');
  const [proficiency, setProficiency] = useState('All levels');

  useEffect(() => {
    mentorService.getAchievementFacets()
      .then((res) => {
        if (res?.data) {
          setFacets(res.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    mentorService.getAchievements({
      q: query,
      category,
      proficiency,
      page: 0,
      size: 50,
    })
      .then((res) => {
        if (mounted && res?.data?.content) {
          setAchievements(res.data.content);
        }
      })
      .catch(() => {
        if (mounted) {
          setAchievements([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [query, category, proficiency]);

  const categories = useMemo(() => {
    if (facets?.categories && facets.categories.length > 0) {
      return ['All categories', ...facets.categories];
    }
    return ['All categories'];
  }, [facets]);

  const proficiencyLevels = ['All levels', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

  const filteredAchievements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return achievements
      .filter((achievement) => {
        const matchesQuery =
          !normalizedQuery ||
          (achievement.skill || '').toLowerCase().includes(normalizedQuery) ||
          (achievement.studentName || '').toLowerCase().includes(normalizedQuery);
        const matchesCategory =
          category === 'All categories' || achievement.category === category;
        const matchesProficiency =
          proficiency === 'All levels' || (achievement.proficiency || '').toLowerCase() === proficiency.toLowerCase();
        return matchesQuery && matchesCategory && matchesProficiency;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [achievements, query, category, proficiency]);

  const summary = facets?.summary || {
    totalAchievements: achievements.length,
    uniqueSkills: new Set(achievements.map((item) => item.skill || item.skillKey)).size,
    studentsWithAchievements: new Set(achievements.map((item) => item.studentId)).size,
    topLevelCount: achievements.filter(
      (item) => (item.proficiency || '').toUpperCase() === 'ADVANCED' || (item.proficiency || '').toUpperCase() === 'EXPERT',
    ).length,
  };

  const hasFilters = query.trim() || category !== 'All categories' || proficiency !== 'All levels';
  const resetFilters = () => {
    setQuery('');
    setCategory('All categories');
    setProficiency('All levels');
  };

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-7">
      <MentorPageHeader
        eyebrow="Skill gallery"
        title="Achieved Skills"
        description="Celebrate the verified skill milestones earned across your cohort. Filter by category, proficiency, or student to explore each achievement."
        icon={Award}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E0CC] bg-white px-3 py-1.5 text-[11px] font-bold text-[#6E6880] shadow-2xs">
            <Sparkles size={13} className="text-[#FF9838]" /> {summary.totalAchievements} verified achievements
          </span>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MentorStatCard
          label="Achievements"
          value={summary.totalAchievements}
          detail="Total verified milestones"
          icon={Award}
          tint="green"
        />
        <MentorStatCard
          label="Unique Skills"
          value={summary.uniqueSkills}
          detail="Across all learning tracks"
          icon={Sparkles}
          tint="purple"
        />
        <MentorStatCard
          label="Students Earning"
          value={summary.studentsWithAchievements}
          detail="Students with at least one skill"
          icon={Users}
          tint="blue"
        />
        <MentorStatCard
          label="Advanced Wins"
          value={summary.topLevelCount}
          detail="Advanced or expert proficiency"
          icon={BrainCircuit}
          tint="orange"
        />
      </section>

      {/* Filters */}
      <section className="space-y-3 rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-3 shadow-xs sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="skill-search" className="sr-only">
              Search skills or students
            </label>
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A79FBE]"
              aria-hidden="true"
            />
            <input
              id="skill-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by skill or student name…"
              className="w-full rounded-2xl border border-[#E8E0CC] bg-white py-2.5 pl-10 pr-10 text-xs text-[#2F2A3E] outline-none transition placeholder:text-[#B4ACC6] focus:border-[#7C5CFA] focus:ring-2 focus:ring-[#EFEAFC]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear skill search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#A79FBE] transition hover:bg-[#F7F3E8] hover:text-[#2F2A3E]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div>
              <label htmlFor="proficiency-filter" className="sr-only">
                Filter by proficiency level
              </label>
              <select
                id="proficiency-filter"
                value={proficiency}
                onChange={(event) => setProficiency(event.target.value)}
                className="appearance-none rounded-2xl border border-[#E8E0CC] bg-white px-3 py-2.5 text-[11px] font-semibold text-[#4C4661] outline-none transition focus:border-[#7C5CFA] focus:ring-2 focus:ring-[#EFEAFC]"
              >
                {proficiencyLevels.map((level) => (
                  <option key={level} value={level}>
                    {level === 'All levels' ? 'All proficiencies' : level}
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
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map((item) => {
            const active = category === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                  active
                    ? 'bg-[#7C5CFA] text-white shadow-2xs'
                    : 'border border-[#E8E0CC] bg-white text-[#6E6880] hover:bg-[#F7F3E8] hover:text-[#2F2A3E]'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </section>

      {/* Grid */}
      {filteredAchievements.length > 0 ? (
        <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAchievements.map((achievement) => {
            const meta = CATEGORY_META[achievement.category] || CATEGORY_META.Programming;
            const CategoryIcon = meta.icon;

            return (
              <div
                key={achievement.id}
                className="flex flex-col justify-between rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-[#7C5CFA] hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border ${meta.tile}`}
                    >
                      <CategoryIcon size={18} />
                    </span>
                    <Badge variant={proficiencyVariant(achievement.proficiency)} size="sm">
                      {achievement.proficiency}
                    </Badge>
                  </div>

                  <h3 className="mt-3 text-sm font-extrabold text-[#2F2A3E]">
                    {achievement.skill}
                  </h3>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#8D8471]">
                    {achievement.category}
                  </p>

                  <div className="mt-3.5 flex items-center gap-2 rounded-2xl border border-[#F0E9DA] bg-[#FDF9EE] p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-[#2F2A3E]">
                        {achievement.studentName}
                      </p>
                      <p className="text-[10px] text-[#8D8471]">
                        {achievement.date ? new Date(achievement.date).toLocaleDateString() : 'Verified'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-[#F0E9DA] pt-3">
                  <div className="mb-1 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-[#6E6880]">Skill Mastery</span>
                    <span className="font-extrabold tabular-nums text-[#2F2A3E]">
                      {achievement.progress}%
                    </span>
                  </div>
                  <ProgressBar
                    value={achievement.progress}
                    tone={progressTone(achievement.progress)}
                    label={`${achievement.skill} mastery`}
                  />
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <MentorEmptyState
          icon={SearchX}
          title={achievements.length === 0 ? "No verified skill milestones yet" : "No achievements match your filters"}
          description={achievements.length === 0 ? "When students in your cohort complete assessments, verified skills will appear here." : "Try clearing your filters or changing the proficiency level."}
          action={
            hasFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-2xl border border-[#E8E0CC] bg-white px-3 py-1.5 text-xs font-bold text-[#2F2A3E] shadow-2xs hover:bg-[#F7F3E8]"
              >
                Clear filters
              </button>
            ) : null
          }
        />
      )}
    </div>
  );
}

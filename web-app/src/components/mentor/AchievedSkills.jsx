import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
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
  if (proficiency === 'Expert') return 'emerald';
  if (proficiency === 'Advanced') return 'indigo';
  if (proficiency === 'Intermediate') return 'amber';
  return 'neutral';
}

export default function AchievedSkills() {
  const { achievements, students } = useOutletContext();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All categories');
  const [proficiency, setProficiency] = useState('All levels');

  const categories = useMemo(
    () => ['All categories', ...Array.from(new Set(achievements.map((item) => item.category)))],
    [achievements],
  );

  const proficiencyLevels = useMemo(
    () => ['All levels', ...Array.from(new Set(achievements.map((item) => item.proficiency)))],
    [achievements],
  );

  const filteredAchievements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return achievements
      .filter((achievement) => {
        const matchesQuery =
          !normalizedQuery ||
          achievement.skill.toLowerCase().includes(normalizedQuery) ||
          achievement.studentName.toLowerCase().includes(normalizedQuery);
        const matchesCategory =
          category === 'All categories' || achievement.category === category;
        const matchesProficiency =
          proficiency === 'All levels' || achievement.proficiency === proficiency;
        return matchesQuery && matchesCategory && matchesProficiency;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [achievements, query, category, proficiency]);

  const studentsWithAchievements = new Set(achievements.map((item) => item.studentId)).size;
  const uniqueSkills = new Set(achievements.map((item) => item.skill)).size;
  const topLevelCount = achievements.filter(
    (item) => item.proficiency === 'Advanced' || item.proficiency === 'Expert',
  ).length;

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
        description="Celebrate the verified skill milestones earned across your demo cohort. Filter by category, proficiency, or student to explore each achievement."
        icon={Award}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E0CC] bg-white px-3 py-1.5 text-[11px] font-bold text-[#6E6880] shadow-2xs">
            <Sparkles size={13} className="text-[#FF9838]" /> Illustrative achievements
          </span>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MentorStatCard
          label="Achievements"
          value={achievements.length}
          detail="Total verified milestones"
          icon={Award}
          tint="green"
        />
        <MentorStatCard
          label="Unique Skills"
          value={uniqueSkills}
          detail="Across all learning tracks"
          icon={Sparkles}
          tint="purple"
        />
        <MentorStatCard
          label="Students Earning"
          value={`${studentsWithAchievements}/${students.length}`}
          detail="Students with at least one skill"
          icon={Users}
          tint="blue"
        />
        <MentorStatCard
          label="Advanced Wins"
          value={topLevelCount}
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
                    {level}
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

        <div className="flex flex-wrap gap-1.5">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${
                category === item
                  ? 'border-[#7C5CFA] bg-[#7C5CFA] text-white shadow-2xs'
                  : 'border-[#E8E0CC] bg-white text-[#6E6880] hover:border-[#7C5CFA]/30 hover:bg-[#EFEAFC] hover:text-[#7C5CFA]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <p className="px-1 text-[10px] font-semibold text-[#8D8471]">
          Showing {filteredAchievements.length} of {achievements.length} demo achievements
        </p>
      </section>

      {filteredAchievements.length === 0 ? (
        <MentorEmptyState
          icon={SearchX}
          title="No achievements match these filters"
          description="Try another skill, student name, category, or proficiency level. Reset the filters to browse the full demo gallery."
          action={
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full bg-[#7C5CFA] px-4 py-2 text-[11px] font-bold text-white transition hover:bg-[#6244E8]"
            >
              Reset filters
            </button>
          }
        />
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAchievements.map((achievement) => {
            const meta = CATEGORY_META[achievement.category] || CATEGORY_META.Programming;
            const Icon = meta.icon;

            return (
              <article
                key={achievement.id}
                className="group relative overflow-hidden rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-[#D8CCAE] hover:shadow-md"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.bar}`} />
                <div className="flex items-start justify-between gap-2 pt-1">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border ${meta.tile}`}
                  >
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <Badge variant={proficiencyVariant(achievement.proficiency)} size="sm">
                    {achievement.proficiency}
                  </Badge>
                </div>

                <h3 className="mt-3 text-sm font-extrabold leading-snug text-[#2F2A3E]">
                  {achievement.skill}
                </h3>
                <p className="mt-0.5 text-[11px] font-semibold text-[#6E6880]">
                  {achievement.studentName}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-[#E8E0CC] bg-[#F7F3E8] px-2 py-0.5 text-[9px] font-bold text-[#6E6880]">
                    {achievement.category}
                  </span>
                  <span className="rounded-full border border-[#E8E0CC] bg-white px-2 py-0.5 text-[9px] font-semibold text-[#8D8471]">
                    {achievement.dateLabel}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[#8D8471]">
                    <span>Mastery</span>
                    <span>{achievement.progress}%</span>
                  </div>
                  <ProgressBar
                    value={achievement.progress}
                    tone={progressTone(achievement.progress)}
                    label={`${achievement.skill} mastery`}
                  />
                </div>
              </article>
            );
          })}
        </section>
      )}

      <p className="rounded-2xl border border-dashed border-[#D8CCAE] bg-[#FDF9EE] px-4 py-3 text-[10px] leading-relaxed text-[#8D8471]">
        All skill achievements on this screen are illustrative demo content for the mentor
        experience. They are not generated from real assessment records.
      </p>
    </div>
  );
}

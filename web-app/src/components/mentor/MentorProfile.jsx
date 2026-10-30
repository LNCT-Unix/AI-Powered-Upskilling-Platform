import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Save,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { getCohortStats } from '../../data/mentorDemoData';
import {
  MentorPageHeader,
  MiniStat,
} from './MentorShared';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,24}$/;

function validateProfile(draft) {
  const errors = {};

  if (!draft.fullName.trim() || draft.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  if (!draft.username.trim()) {
    errors.username = 'Username is required.';
  } else if (!USERNAME_REGEX.test(draft.username.trim())) {
    errors.username = 'Use 3–24 letters, numbers, dots, or underscores.';
  }

  if (!draft.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(draft.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (draft.bio.length > 240) {
    errors.bio = 'Keep your bio under 240 characters.';
  }

  return errors;
}

export default function MentorProfile() {
  const { mentor, updateMentor, uniqueKey, students, achievements, showToast } =
    useOutletContext();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(mentor);
  const [errors, setErrors] = useState({});

  const stats = getCohortStats(students, achievements);

  const startEditing = () => {
    setDraft({ ...mentor, expertise: mentor.expertise.join(', ') });
    setErrors({});
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(mentor);
    setErrors({});
    setEditing(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDraft((previous) => ({ ...previous, [name]: value }));
    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: undefined }));
    }
  };

  const handleSave = (event) => {
    event.preventDefault();
    const nextErrors = validateProfile(draft);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    updateMentor({
      ...mentor,
      fullName: draft.fullName.trim(),
      username: draft.username.trim(),
      email: draft.email.trim(),
      title: draft.title.trim(),
      bio: draft.bio.trim(),
      location: draft.location.trim(),
      expertise: draft.expertise
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    });
    setEditing(false);
    showToast('Demo profile updated for this session. Nothing was saved to the backend.');
  };

  const inputClass =
    'w-full rounded-2xl border border-[#E8E0CC] bg-white px-3.5 py-2.5 text-xs text-[#2F2A3E] outline-none transition placeholder:text-[#B4ACC6] focus:border-[#7C5CFA] focus:ring-2 focus:ring-[#EFEAFC]';
  const errorClass = 'border-rose-400 focus:border-rose-500 focus:ring-rose-100';

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-7">
      <MentorPageHeader
        eyebrow="Mentor identity"
        title="My Profile"
        description="Manage the mentor profile shown in your demo studio. Profile edits are temporary frontend state and reset when the page reloads."
        icon={UserCircle2}
        actions={
          !editing ? (
            <Button variant="primary" size="sm" onClick={startEditing}>
              <Pencil size={14} /> Edit Profile
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={cancelEditing}>
              <X size={14} /> Cancel editing
            </Button>
          )
        }
      />

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Main profile card */}
        <section className="overflow-hidden rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] shadow-xs xl:col-span-2">
          <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[#33277A] via-[#4A3A94] to-[#7C5CFA] sm:h-32">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 left-12 h-40 w-40 rounded-full bg-[#FF9838]/25 blur-2xl" />
            <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-white/85 backdrop-blur-xs">
              <ShieldCheck size={11} /> Demo Mentor
            </span>
          </div>

          <div className="px-5 pb-5 sm:px-6">
            <div className="-mt-10 flex flex-col gap-3 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
              <UserAvatar
                user={mentor}
                size="2xl"
                className="border-4 border-[#FFFDF7] shadow-md"
              />
              <div className="flex flex-wrap gap-2 sm:pb-1">
                <Badge variant="indigo" size="sm" icon={Sparkles}>
                  Mentor
                </Badge>
                <Badge variant="emerald" size="sm" icon={CheckCircle2}>
                  Demo verified
                </Badge>
              </div>
            </div>

            {editing ? (
              <form onSubmit={handleSave} className="mt-5 space-y-3.5" noValidate>
                <div className="flex items-start gap-2.5 rounded-2xl border border-[#E4D7FF] bg-[#EFEAFC]/70 p-3 text-[11px] text-[#3D2C86]">
                  <Pencil size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Editing is a frontend demonstration. Changes update this page only and are not
                    stored in any account or database.
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="profile-name" className="mb-1 block text-[10px] font-bold text-[#4C4661]">
                      Full name
                    </label>
                    <input
                      id="profile-name"
                      name="fullName"
                      value={draft.fullName}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.fullName ? errorClass : ''}`}
                      aria-invalid={Boolean(errors.fullName)}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-[10px] font-semibold text-rose-600">{errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="profile-username" className="mb-1 block text-[10px] font-bold text-[#4C4661]">
                      Username
                    </label>
                    <input
                      id="profile-username"
                      name="username"
                      value={draft.username}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.username ? errorClass : ''}`}
                      aria-invalid={Boolean(errors.username)}
                    />
                    {errors.username && (
                      <p className="mt-1 text-[10px] font-semibold text-rose-600">{errors.username}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="profile-email" className="mb-1 block text-[10px] font-bold text-[#4C4661]">
                      Email
                    </label>
                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      value={draft.email}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.email ? errorClass : ''}`}
                      aria-invalid={Boolean(errors.email)}
                    />
                    {errors.email && (
                      <p className="mt-1 text-[10px] font-semibold text-rose-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="profile-title" className="mb-1 block text-[10px] font-bold text-[#4C4661]">
                      Professional title
                    </label>
                    <input
                      id="profile-title"
                      name="title"
                      value={draft.title}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-location" className="mb-1 block text-[10px] font-bold text-[#4C4661]">
                      Location
                    </label>
                    <input
                      id="profile-location"
                      name="location"
                      value={draft.location}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-expertise" className="mb-1 block text-[10px] font-bold text-[#4C4661]">
                      Expertise (comma separated)
                    </label>
                    <input
                      id="profile-expertise"
                      name="expertise"
                      value={draft.expertise}
                      onChange={(event) =>
                        setDraft((previous) => ({ ...previous, expertise: event.target.value }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-bio" className="mb-1 block text-[10px] font-bold text-[#4C4661]">
                    Short bio
                  </label>
                  <textarea
                    id="profile-bio"
                    name="bio"
                    rows={3}
                    value={draft.bio}
                    onChange={handleChange}
                    className={`${inputClass} resize-none ${errors.bio ? errorClass : ''}`}
                    aria-invalid={Boolean(errors.bio)}
                  />
                  <div className="mt-1 flex items-center justify-between text-[9px] text-[#8D8471]">
                    <span>Shown on your mentor profile card.</span>
                    <span className={draft.bio.length > 240 ? 'font-bold text-rose-600' : ''}>
                      {draft.bio.length}/240
                    </span>
                  </div>
                  {errors.bio && (
                    <p className="mt-1 text-[10px] font-semibold text-rose-600">{errors.bio}</p>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                  <Button variant="secondary" size="sm" type="button" onClick={cancelEditing}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit">
                    <Save size={14} /> Save demo changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-extrabold tracking-tight text-[#2F2A3E]">
                    {mentor.fullName}
                  </h2>
                  <Badge variant="indigo" size="sm">
                    {mentor.role === 'MENTOR' ? 'Mentor' : mentor.role}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[11px] font-semibold text-[#7C5CFA]">@{mentor.username}</p>
                <p className="mt-2 text-xs font-bold text-[#4C4661]">{mentor.title}</p>
                <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#6E6880]">{mentor.bio}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {mentor.expertise.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#E8E0CC] bg-[#F7F3E8] px-2.5 py-1 text-[10px] font-bold text-[#6E6880]"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                  <MiniStat label="Students" value={stats.totalStudents} icon={Users} />
                  <MiniStat label="Skills achieved" value={stats.skillsAchieved} icon={Award} />
                  <MiniStat label="Tests tracked" value={stats.testsTaken} icon={BookOpen} />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Details sidebar */}
        <div className="space-y-5">
          <section className="rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#E4D7FF] bg-[#EFEAFC] text-[#7C5CFA]">
                <UserCircle2 size={17} />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-[#2F2A3E]">Account details</h2>
                <p className="text-[10px] text-[#8D8471]">Demo mentor information</p>
              </div>
            </div>

            <dl className="mt-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <Mail size={14} className="mt-0.5 shrink-0 text-[#8D8471]" />
                <div className="min-w-0">
                  <dt className="text-[9px] font-extrabold uppercase tracking-wider text-[#8D8471]">
                    Email
                  </dt>
                  <dd className="truncate text-[11px] font-semibold text-[#2F2A3E]">{mentor.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#8D8471]" />
                <div className="min-w-0">
                  <dt className="text-[9px] font-extrabold uppercase tracking-wider text-[#8D8471]">
                    Mentor ID
                  </dt>
                  <dd className="truncate font-mono text-[11px] font-bold text-[#2F2A3E]">
                    {mentor.mentorId}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <KeyRound size={14} className="mt-0.5 shrink-0 text-[#8D8471]" />
                <div className="min-w-0">
                  <dt className="text-[9px] font-extrabold uppercase tracking-wider text-[#8D8471]">
                    Current demo key
                  </dt>
                  <dd className="truncate font-mono text-[11px] font-bold text-[#7C5CFA]">
                    {uniqueKey}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="mt-0.5 shrink-0 text-[#8D8471]" />
                <div className="min-w-0">
                  <dt className="text-[9px] font-extrabold uppercase tracking-wider text-[#8D8471]">
                    Location
                  </dt>
                  <dd className="truncate text-[11px] font-semibold text-[#2F2A3E]">
                    {mentor.location || 'Not set'}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CalendarDays size={14} className="mt-0.5 shrink-0 text-[#8D8471]" />
                <div className="min-w-0">
                  <dt className="text-[9px] font-extrabold uppercase tracking-wider text-[#8D8471]">
                    Joined
                  </dt>
                  <dd className="truncate text-[11px] font-semibold text-[#2F2A3E]">
                    {mentor.joinedAt}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl border border-dashed border-[#D8CCAE] bg-[#FDF9EE] p-4">
            <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#4C4661]">
              <CheckCircle2 size={14} className="text-[#138A63]" /> Temporary demo state
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-[#8D8471]">
              Profile edits, key changes, and cohort insights are frontend-only. Refreshing the page
              restores the original sample mentor profile. No account or database record is touched.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

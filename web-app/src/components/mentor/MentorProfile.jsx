import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  Loader2,
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
import {
  MentorPageHeader,
  MiniStat,
} from './MentorShared';
import { mentorService } from '../../services/mentorService';

function validateProfile(draft) {
  const errors = {};

  if (!draft.fullName?.trim() || draft.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  if (draft.bio && draft.bio.length > 240) {
    errors.bio = 'Keep your bio under 240 characters.';
  }

  return errors;
}

export default function MentorProfile() {
  const { mentor, updateMentor, uniqueKey, showToast } =
    useOutletContext();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(mentor);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    testsTaken: 0,
    skillsAchieved: 0,
  });

  useEffect(() => {
    mentorService.getOverview()
      .then((res) => {
        if (res?.data?.stats) {
          setStats({
            totalStudents: res.data.stats.totalStudents || 0,
            testsTaken: res.data.stats.testsTaken || 0,
            skillsAchieved: res.data.stats.skillsAchieved || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  const startEditing = () => {
    setDraft({
      ...mentor,
      expertise: Array.isArray(mentor.expertise) ? mentor.expertise.join(', ') : (mentor.expertise || ''),
    });
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

  const handleSave = async (event) => {
    event.preventDefault();
    const nextErrors = validateProfile(draft);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    const expArray = typeof draft.expertise === 'string'
      ? draft.expertise.split(',').map((item) => item.trim()).filter(Boolean)
      : (draft.expertise || []);

    try {
      const res = await mentorService.updateProfile({
        title: draft.title?.trim() || null,
        bio: draft.bio?.trim() || null,
        location: draft.location?.trim() || null,
        expertise: expArray,
      });

      if (res?.data) {
        updateMentor((prev) => ({
          ...prev,
          title: res.data.title || prev.title,
          bio: res.data.bio || prev.bio,
          location: res.data.location || prev.location,
          expertise: res.data.expertise || expArray,
        }));
      } else {
        updateMentor((prev) => ({
          ...prev,
          title: draft.title?.trim() || prev.title,
          bio: draft.bio?.trim() || prev.bio,
          location: draft.location?.trim() || prev.location,
          expertise: expArray,
        }));
      }

      setEditing(false);
      showToast('Mentor profile updated successfully.');
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Could not update profile.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-[#E8E0CC] bg-white px-3.5 py-2.5 text-xs text-[#2F2A3E] outline-none transition placeholder:text-[#B4ACC6] focus:border-[#7C5CFA] focus:ring-2 focus:ring-[#EFEAFC]';
  const errorClass = 'border-rose-400 focus:border-rose-500 focus:ring-rose-100';

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-7">
      <MentorPageHeader
        eyebrow="Mentor identity"
        title="My Profile"
        description="Manage your public mentor identity, professional bio, and technical expertise areas."
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
              <ShieldCheck size={11} /> Mentor Profile
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
                  Verified
                </Badge>
              </div>
            </div>

            {editing ? (
              <form onSubmit={handleSave} className="mt-5 space-y-3.5" noValidate>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="profile-title" className="mb-1 block text-[10px] font-bold text-[#4C4661]">
                      Professional title
                    </label>
                    <input
                      id="profile-title"
                      name="title"
                      value={draft.title || ''}
                      onChange={handleChange}
                      placeholder="e.g. Senior Software Engineer"
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
                      value={draft.location || ''}
                      onChange={handleChange}
                      placeholder="e.g. Bengaluru, India"
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="profile-expertise" className="mb-1 block text-[10px] font-bold text-[#4C4661]">
                      Expertise (comma separated, max 12)
                    </label>
                    <input
                      id="profile-expertise"
                      name="expertise"
                      value={draft.expertise || ''}
                      onChange={(event) =>
                        setDraft((previous) => ({ ...previous, expertise: event.target.value }))
                      }
                      placeholder="e.g. React, Python, System Design"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-bio" className="mb-1 block text-[10px] font-bold text-[#4C4661]">
                    Short bio (max 240 chars)
                  </label>
                  <textarea
                    id="profile-bio"
                    name="bio"
                    rows={3}
                    value={draft.bio || ''}
                    onChange={handleChange}
                    className={`${inputClass} resize-none ${errors.bio ? errorClass : ''}`}
                    aria-invalid={Boolean(errors.bio)}
                  />
                  <div className="mt-1 flex items-center justify-between text-[9px] text-[#8D8471]">
                    <span>Shown on your mentor profile card.</span>
                    <span className={(draft.bio || '').length > 240 ? 'font-bold text-rose-600' : ''}>
                      {(draft.bio || '').length}/240
                    </span>
                  </div>
                  {errors.bio && (
                    <p className="mt-1 text-[10px] font-semibold text-rose-600">{errors.bio}</p>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                  <Button variant="secondary" size="sm" type="button" onClick={cancelEditing} disabled={saving}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={saving}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>{saving ? 'Saving changes…' : 'Save changes'}</span>
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
                  {(Array.isArray(mentor.expertise) ? mentor.expertise : []).map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#E8E0CC] bg-[#F7F3E8] px-2.5 py-1 text-[10px] font-bold text-[#6E6880]"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-4 border-t border-[#F0E9DA] pt-3 text-[11px] text-[#8D8471]">
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} className="text-[#A79FBE]" /> {mentor.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#A79FBE]" /> {mentor.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={13} className="text-[#A79FBE]" /> Joined {mentor.joinedAt ? new Date(mentor.joinedAt).toLocaleDateString() : 'January 2026'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar stats & key */}
        <div className="space-y-4">
          <section className="rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-4 shadow-xs sm:p-5">
            <h3 className="text-xs font-extrabold text-[#2F2A3E]">Cohort snapshot</h3>
            <p className="mt-0.5 text-[10px] text-[#8D8471]">Summary of your current cohort</p>

            <div className="mt-4 space-y-2">
              <MiniStat label="Total students" value={stats.totalStudents} icon={Users} />
              <MiniStat label="Tests taken" value={stats.testsTaken} icon={Award} />
              <MiniStat label="Verified skills" value={stats.skillsAchieved} icon={BookOpen} />
            </div>
          </section>

          <section className="rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-4 shadow-xs sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-[#2F2A3E]">Your mentor key</h3>
              <KeyRound size={14} className="text-[#7C5CFA]" />
            </div>
            <p className="mt-1 font-mono text-sm font-extrabold tracking-wider text-[#7C5CFA]">
              {uniqueKey || 'NO-KEY-YET'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

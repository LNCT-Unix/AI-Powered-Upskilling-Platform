import { useState, useEffect } from 'react';
import {
  Link2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  KeyRound,
  Sparkles,
  Unlink,
} from 'lucide-react';
import { mentorService } from '../../services/mentorService';
import Button from '../ui/Button';

export default function StudentMentorConnector({
  variant = 'card', // 'card' | 'compact' | 'inline'
  onSuccess,
  showTitle = true,
  className = '',
}) {
  const [mentorLink, setMentorLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Fetch current link status on mount
  useEffect(() => {
    let ignore = false;
    async function fetchCurrentLink() {
      try {
        setLoading(true);
        const res = await mentorService.getStudentMentorLink();
        if (!ignore && res?.data) {
          setMentorLink(res.data);
        }
      } catch {
        // Not linked or failed to fetch, treat as unlinked
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchCurrentLink();
    return () => {
      ignore = true;
    };
  }, []);

  const handleInputChange = (e) => {
    let val = e.target.value.toUpperCase().replace(/\s+/g, '');
    setKeyInput(val);
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanKey = keyInput.trim().toUpperCase();

    if (!cleanKey) {
      setErrorMsg('Please enter a mentor key.');
      return;
    }

    if (!/^MENTOR-[A-Z0-9]{4,10}$/i.test(cleanKey)) {
      setErrorMsg('Invalid key format. Expected format: MENTOR-XXXXXX');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await mentorService.linkStudentToMentor(cleanKey);
      if (res?.data) {
        setMentorLink(res.data);
        const name = res.data.mentorName || 'your mentor';
        setSuccessMsg(`Successfully connected with ${name}!`);
        setKeyInput('');
        if (onSuccess) onSuccess(res.data);
      } else {
        setErrorMsg(res?.message || 'Failed to connect. Please check the key.');
      }
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.data?.data?.message ||
        err?.message ||
        'Could not link mentor. Please check the key and try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm('Are you sure you want to disconnect from this mentor?')) return;

    setUnlinking(true);
    setErrorMsg(null);
    try {
      await mentorService.unlinkStudentFromMentor();
      setMentorLink(null);
      setSuccessMsg('Disconnected from mentor.');
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to disconnect from mentor.');
    } finally {
      setUnlinking(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 text-xs text-slate-400 ${className}`}>
        <Loader2 size={16} className="animate-spin mr-2" /> Checking mentor status…
      </div>
    );
  }

  // State 1: Student is already linked to a mentor
  if (mentorLink) {
    return (
      <div
        className={`rounded-2xl border border-[#BFE9D2] bg-[#E7F8EF]/70 p-4 transition ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#2FBF8F] text-white shadow-2xs">
              <GraduationCap size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-[#2F2A3E]">
                  {mentorLink.mentorName || 'Assigned Mentor'}
                </h4>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#2FBF8F]/15 px-2 py-0.5 text-[9px] font-extrabold text-[#1B805E]">
                  <CheckCircle2 size={11} /> Connected
                </span>
              </div>
              <p className="text-[11px] text-[#6E6880] mt-0.5">
                Your progress, skill mastery, and test analytics are shared with this cohort.
              </p>
              {mentorLink.linkedAt && (
                <p className="text-[10px] text-[#8D8471] mt-1">
                  Linked on {new Date(mentorLink.linkedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleUnlink}
            disabled={unlinking}
            title="Disconnect from mentor"
            className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-600 transition shrink-0 p-1"
          >
            {unlinking ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <>
                <Unlink size={13} />
                <span className="hidden sm:inline">Disconnect</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // State 2: Student is not linked -> Input form
  const isInline = variant === 'inline';
  const isCompact = variant === 'compact';

  return (
    <div
      className={`${
        isInline
          ? 'rounded-xl border border-indigo-100 bg-indigo-50/50 p-4'
          : isCompact
          ? 'space-y-3'
          : 'rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-5 shadow-xs'
      } ${className}`}
    >
      {showTitle && (
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#EFEAFC] text-[#7C5CFA]">
              <KeyRound size={16} />
            </span>
            <div>
              <h3 className="text-xs font-extrabold text-[#2F2A3E]">
                {isInline ? 'Have a Mentor Key?' : 'Join Mentor Cohort'}
              </h3>
              <p className="text-[10px] text-[#8D8471]">
                {isInline
                  ? 'Connect with your mentor or instructor (optional)'
                  : 'Enter the code provided by your mentor to join their cohort'}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-[#FFFDF7] border border-[#E8E0CC] px-2 py-0.5 text-[9px] font-bold text-[#8D8471]">
            Cohort Sync
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-3 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
          <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700">
          <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={keyInput}
              onChange={handleInputChange}
              placeholder="e.g. MENTOR-7X9K2P"
              maxLength={20}
              className="w-full rounded-xl border border-[#E8E0CC] bg-white px-3.5 py-2 text-xs font-mono font-bold tracking-wider text-slate-800 placeholder:font-sans placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-[#7C5CFA] focus:ring-2 focus:ring-[#7C5CFA]/15 transition"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={submitting || !keyInput.trim()}
            className="shrink-0"
          >
            {submitting ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Linking…
              </>
            ) : (
              <>
                <Link2 size={13} /> Link Key
              </>
            )}
          </Button>
        </div>
        <p className="text-[10px] text-[#8D8471] leading-tight">
          Ask your instructor or mentor for their 6-character cohort joining key.
        </p>
      </form>
    </div>
  );
}


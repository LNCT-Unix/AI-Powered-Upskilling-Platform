import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Link2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Button from '../ui/Button';
import {
  MentorModal,
  MentorPageHeader,
  MentorStatCard,
} from './MentorShared';
import { mentorService } from '../../services/mentorService';

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  const succeeded = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!succeeded) throw new Error('Copy command failed');
}

export default function MentorUniqueKey() {
  const { uniqueKey, setUniqueKey, showToast } = useOutletContext();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [keyMeta, setKeyMeta] = useState(null);
  const copiedTimer = useRef(null);

  useEffect(() => {
    mentorService.getKey()
      .then((res) => {
        if (res?.data) {
          setKeyMeta(res.data);
          if (res.data.key) setUniqueKey(res.data.key);
        }
      })
      .catch(() => {});
  }, [setUniqueKey]);

  const handleCreateClick = () => {
    setConfirmOpen(true);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await mentorService.generateOrRotateKey(Boolean(uniqueKey));
      if (res?.data?.key) {
        setUniqueKey(res.data.key);
        setKeyMeta(res.data);
        showToast('New mentor key generated and saved. Copy it and share it with your cohort.');
      }
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Could not generate mentor key.';
      showToast(msg, 'error');
    } finally {
      setGenerating(false);
      setConfirmOpen(false);
      setCopied(false);
    }
  };

  const handleCopy = async () => {
    if (!uniqueKey) {
      showToast('Generate a key before copying.', 'error');
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(uniqueKey);
      } else {
        fallbackCopy(uniqueKey);
      }

      window.clearTimeout(copiedTimer.current);
      setCopied(true);
      showToast('Mentor key copied to clipboard.');
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      showToast('Could not copy the key. Please select and copy it manually.', 'error');
    }
  };

  const linkedCount = keyMeta?.linkedStudentCount ?? 0;

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-7">
      <MentorPageHeader
        eyebrow="Student connection"
        title="My Unique Key"
        description="Use a mentor key to connect students to your cohort. Generate, copy, and share the key."
        icon={KeyRound}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E0CC] bg-white px-3 py-1.5 text-[11px] font-bold text-[#6E6880] shadow-2xs">
            <ShieldCheck size={13} className="text-[#138A63]" /> Active Key
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MentorStatCard
          label="Key Status"
          value={uniqueKey ? 'Active' : 'Missing'}
          detail={uniqueKey ? 'Key is live and active' : 'No active key yet'}
          icon={KeyRound}
          tint={uniqueKey ? 'green' : 'orange'}
        />
        <MentorStatCard
          label="Connected Students"
          value={linkedCount}
          detail="Linked cohort members"
          icon={Users}
          tint="purple"
        />
        <MentorStatCard
          label="Key Format"
          value="MENTOR-XXXXXX"
          detail="Standard joining code"
          icon={Sparkles}
          tint="blue"
        />
        <MentorStatCard
          label="Persistence"
          value="Database"
          detail="Stored securely in platform"
          icon={ShieldCheck}
          tint="green"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Key card */}
        <section className="relative overflow-hidden rounded-3xl border border-[#4A3A94] bg-gradient-to-br from-[#33277A] via-[#3D2C86] to-[#6244E8] p-5 text-white shadow-lg sm:p-7 xl:col-span-2">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-[#FF9838]/20 blur-3xl" />

          <div className="relative z-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest">
                <KeyRound size={11} /> Mentor connection key
              </span>
            </div>

            <h2 className="mt-4 text-xl font-extrabold sm:text-2xl">Your mentor key</h2>
            <p className="mt-1 max-w-lg text-[11px] leading-relaxed text-white/70 sm:text-xs">
              Share this key with your students so they can connect with you.
            </p>

            <div className="mt-5 rounded-2xl border border-dashed border-white/30 bg-white/10 p-4 backdrop-blur-xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-white/55">
                    Current key
                  </p>
                  <p className="mt-1 break-all font-mono text-xl font-extrabold tracking-[0.16em] text-white sm:text-2xl">
                    {uniqueKey || 'NO-KEY-YET'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-[11px] font-extrabold shadow-md transition ${
                    copied
                      ? 'bg-[#2FBF8F] text-white'
                      : 'bg-white text-[#3D2C86] hover:bg-[#F7F3E8]'
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Key'}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleCreateClick}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/25 bg-white/10 px-4 py-2.5 text-[11px] font-extrabold text-white transition hover:bg-white/20"
              >
                <RefreshCw size={13} /> {uniqueKey ? 'Rotate Mentor Key' : 'Create Mentor Key'}
              </button>
              {uniqueKey && (
                <span className="inline-flex items-center justify-center gap-1.5 rounded-2xl px-2 text-[10px] font-medium text-white/55">
                  <AlertTriangle size={12} /> Replacing the key revokes the current one.
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Explanation card */}
        <section className="rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#E4D7FF] bg-[#EFEAFC] text-[#7C5CFA]">
              <Link2 size={17} />
            </span>
            <div>
              <h3 className="text-xs font-extrabold text-[#2F2A3E]">How joining works</h3>
              <p className="text-[10px] text-[#8D8471]">Cohort connection protocol</p>
            </div>
          </div>

          <ol className="mt-4 space-y-3 text-[11px] leading-relaxed text-[#6E6880]">
            <li className="flex items-start gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#EFEAFC] text-[10px] font-extrabold text-[#7C5CFA]">
                1
              </span>
              <span>Copy your active key and send it to your students.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#EFEAFC] text-[10px] font-extrabold text-[#7C5CFA]">
                2
              </span>
              <span>Students enter your key in their settings or onboarding.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#EFEAFC] text-[10px] font-extrabold text-[#7C5CFA]">
                3
              </span>
              <span>
                Their diagnostic test results, progress bands, and verified milestones appear in your studio.
              </span>
            </li>
          </ol>
        </section>
      </div>

      {/* Confirmation modal for replacing the key */}
      <MentorModal
        open={confirmOpen}
        onClose={() => !generating && setConfirmOpen(false)}
        title={uniqueKey ? 'Replace mentor key?' : 'Generate mentor key?'}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={generating}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={generating}
              onClick={handleGenerate}
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating…
                </>
              ) : (
                'Generate key'
              )}
            </Button>
          </>
        }
      >
        <p className="text-xs leading-relaxed text-[#6E6880]">
          {uniqueKey ? (
            <>
              Existing students linked to <strong>{uniqueKey}</strong> remain in your cohort. However, any new student attempting to use <strong>{uniqueKey}</strong> will need the new key.
            </>
          ) : (
            'Generate a new unique joining key for your cohort.'
          )}
        </p>
      </MentorModal>
    </div>
  );
}

import { useRef, useState } from 'react';
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
import { generateMentorKey } from '../../data/mentorDemoData';
import {
  MentorModal,
  MentorPageHeader,
  MentorStatCard,
} from './MentorShared';

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
  const { uniqueKey, setUniqueKey, students, showToast } = useOutletContext();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(null);

  const handleCreateClick = () => {
    if (uniqueKey) {
      setConfirmOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((resolve) => {
      window.setTimeout(resolve, 550);
    });

    const nextKey = generateMentorKey();
    setUniqueKey(nextKey);
    setGenerating(false);
    setConfirmOpen(false);
    setCopied(false);
    showToast('New demo mentor key generated. Copy it and share it with your cohort.');
  };

  const handleCopy = async () => {
    if (!uniqueKey) {
      showToast('Create a demo key before copying.', 'error');
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

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-7">
      <MentorPageHeader
        eyebrow="Student connection"
        title="My Unique Key"
        description="Use a mentor key to connect demo students to your cohort. Generate, copy, and share the key — all state stays in this browser session."
        icon={KeyRound}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E0CC] bg-white px-3 py-1.5 text-[11px] font-bold text-[#6E6880] shadow-2xs">
            <ShieldCheck size={13} className="text-[#138A63]" /> Frontend-only key
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MentorStatCard
          label="Key Status"
          value={uniqueKey ? 'Active' : 'Missing'}
          detail="Demo key available to share"
          icon={KeyRound}
          tint={uniqueKey ? 'green' : 'orange'}
        />
        <MentorStatCard
          label="Connected Students"
          value={students.length}
          detail="Illustrative cohort members"
          icon={Users}
          tint="purple"
        />
        <MentorStatCard
          label="Key Format"
          value="MENTOR-XXXXXX"
          detail="6 random characters"
          icon={Sparkles}
          tint="blue"
        />
        <MentorStatCard
          label="Persistence"
          value="Session"
          detail="Resets when the page reloads"
          icon={ShieldCheck}
          tint="orange"
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
              <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#FFC93C]/30 bg-[#FFC93C]/15 px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-[#FFE7A3]">
                <Sparkles size={11} /> Demo only
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
                <RefreshCw size={13} /> Create Unique Key
              </button>
              <span className="inline-flex items-center justify-center gap-1.5 rounded-2xl px-2 text-[10px] font-medium text-white/55">
                <AlertTriangle size={12} /> Replacing the key requires confirmation.
              </span>
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
              <h2 className="text-sm font-extrabold text-[#2F2A3E]">How students connect</h2>
              <p className="text-[10px] text-[#8D8471]">Three simple demo steps</p>
            </div>
          </div>

          <ol className="mt-4 space-y-3">
            {[
              {
                title: 'Share your key',
                description: 'Send the key to students through your usual channel.',
              },
              {
                title: 'Student enters the key',
                description: 'They link their demo learning profile to your mentor cohort.',
              },
              {
                title: 'Track progress here',
                description: 'Review skills and test insights from the mentor dashboard.',
              },
            ].map((step, index) => (
              <li key={step.title} className="flex gap-2.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-[#E4D7FF] bg-[#EFEAFC] text-[10px] font-extrabold text-[#7C5CFA]">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[11px] font-extrabold text-[#2F2A3E]">{step.title}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-[#8D8471]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 rounded-2xl border border-dashed border-[#D8CCAE] bg-[#FDF9EE] p-3 text-[10px] leading-relaxed text-[#8D8471]">
            This key is generated in the browser for demonstration only. It is not validated,
            persisted, or linked to a real mentor account.
          </div>
        </section>
      </div>

      {/* Confirmation modal */}
      <MentorModal
        open={confirmOpen}
        onClose={() => {
          if (!generating) setConfirmOpen(false);
        }}
        title="Create a new unique key?"
        subtitle="Your current demo key will be replaced in this browser session."
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <RefreshCw size={14} /> Create new key
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-[#FFD9B8] bg-[#FFF6EC] p-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#FFD9B8] bg-white text-[#C06A14]">
              <AlertTriangle size={17} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-[#8A4F0E]">Existing key detected</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[#9A5B16]">
                Students using <strong className="font-mono">{uniqueKey}</strong> would need the new
                key in a real implementation. Continue only if you want a fresh demo key.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8E0CC] bg-[#FDF9EE] p-3">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#8D8471]">
              Current key
            </p>
            <p className="mt-1 font-mono text-base font-extrabold tracking-[0.14em] text-[#2F2A3E]">
              {uniqueKey}
            </p>
          </div>
        </div>
      </MentorModal>
    </div>
  );
}

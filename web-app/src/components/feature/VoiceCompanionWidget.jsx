import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, RotateCcw, Sparkles, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { assistantService } from '../../services/assistantService';

// Module-level global reference to guarantee only one voice clip plays at any time
let currentGlobalAudio = null;

export function stopCurrentVoiceAudio() {
  if (currentGlobalAudio) {
    try {
      currentGlobalAudio.pause();
      currentGlobalAudio.currentTime = 0;
      currentGlobalAudio.src = '';
    } catch {
      // ignore
    }
    currentGlobalAudio = null;
  }
}

export default function VoiceCompanionWidget({ voiceFeedback, onClose, loading = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // If loading or no feedback, do not play
    if (loading || !voiceFeedback) return;

    // Stop any previously playing audio across the platform
    stopCurrentVoiceAudio();

    if (!voiceFeedback?.audio?.available || !voiceFeedback?.audio?.url) {
      setIsPlaying(false);
      return;
    }

    const audioUrl = assistantService.getAudioUrl(voiceFeedback.audio.url);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    currentGlobalAudio = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPlaying(false);
    audio.onerror = (e) => {
      console.warn('Voice companion audio playback error:', e);
      setIsPlaying(false);
    };

    // Auto-play the voice feedback immediately
    audio.play().catch((err) => {
      console.warn('Autoplay prevented by browser policy (user interaction required):', err);
      setIsPlaying(false);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        if (currentGlobalAudio === audioRef.current) {
          currentGlobalAudio = null;
        }
      }
    };
  }, [voiceFeedback, loading]);

  // Loading state
  if (loading) {
    return (
      <div className="my-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 shadow-xs transition-all animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles size={15} className="animate-spin" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-900">AI Learning Companion</p>
              <p className="text-[11px] text-indigo-600">Generating voice reaction and concept insight...</p>
            </div>
          </div>
          <Loader2 size={16} className="animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (!voiceFeedback?.feedback) return null;

  const { isCorrect, feedback, audio } = voiceFeedback;

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div
      className={`my-3.5 rounded-2xl border p-4 shadow-xs transition-all duration-300 ${
        isCorrect
          ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
          : 'border-indigo-200 bg-indigo-50/70 text-indigo-950'
      }`}
      role="region"
      aria-label="AI Voice Feedback"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b pb-2.5 mb-2.5 border-black/5">
        <div className="flex items-center gap-2.5">
          <div
            className={`grid h-7 w-7 place-items-center rounded-xl text-white shadow-xs ${
              isCorrect ? 'bg-emerald-600' : 'bg-indigo-600'
            }`}
          >
            {isCorrect ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
          </div>
          <div>
            <span
              className={`text-xs font-extrabold uppercase tracking-wider ${
                isCorrect ? 'text-emerald-800' : 'text-indigo-800'
              }`}
            >
              {isCorrect ? '🎉 Great Job!' : '💡 AI Learning Companion'}
            </span>
          </div>
        </div>

        {/* Audio controls */}
        <div className="flex items-center gap-1.5">
          {audio?.available ? (
            <>
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  isCorrect
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
                aria-label={isPlaying ? 'Pause voice' : 'Play voice'}
              >
                {isPlaying ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                onClick={handleReplay}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                title="Replay Voice"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Replay</span>
              </button>
            </>
          ) : (
            <span className="text-[11px] text-slate-500 italic">Audio unavailable</span>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-black/5 transition cursor-pointer ml-1"
              aria-label="Dismiss feedback"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Spoken Reaction */}
      <div className="space-y-1.5">
        <p className="text-sm font-bold leading-relaxed text-slate-900">
          {feedback.reaction}
        </p>

        {/* Concept Reinforcement */}
        {feedback.conceptReinforcement && (
          <p className="text-xs font-medium leading-relaxed text-slate-700">
            {feedback.conceptReinforcement}
          </p>
        )}

        {/* Bonus Tip Card */}
        {feedback.bonusTip && (
          <div
            className={`mt-2 rounded-xl p-2.5 text-xs font-medium shadow-2xs ${
              isCorrect
                ? 'bg-white/90 border-l-4 border-emerald-500 text-emerald-950'
                : 'bg-white/90 border-l-4 border-indigo-500 text-indigo-950'
            }`}
          >
            <span className="font-extrabold mr-1">Bonus Tip:</span>
            <span>{feedback.bonusTip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

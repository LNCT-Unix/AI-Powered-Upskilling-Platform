export default function ScoreRing({ score }) {
  const c = 2 * Math.PI * 43;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label={`Overall skill score ${score} out of 100`}
      >
        <circle cx="50" cy="50" r="43" fill="none" stroke="#e8eee8" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke="#176b45"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-green-950">{score}</span>
        <span className="text-xs text-slate-400">out of 100</span>
      </div>
    </div>
  );
}

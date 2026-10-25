export default function ScoreRing({
  score = 0,
  size = 112,
  strokeWidth = 8,
  label = 'Overall skill score',
  color = '#4f46e5',
  trackColor = '#e2e8f0',
}) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - normalizedScore / 100);

  return (
    <div
      className="relative shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-full w-full -rotate-90"
        role="progressbar"
        aria-label={`${label}: ${normalizedScore} out of 100`}
        aria-valuenow={normalizedScore}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Indicator circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
          {normalizedScore}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          out of 100
        </span>
      </div>
    </div>
  );
}

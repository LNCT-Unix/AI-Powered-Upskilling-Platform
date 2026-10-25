import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ onClick, asLink = true }) {
  const content = (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-lg bg-slate-900 text-indigo-400 shadow-xs border border-slate-800">
        <Compass size={19} className="text-indigo-400" />
      </span>
      <div className="flex flex-col text-left leading-none">
        <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
          AI<span className="text-indigo-600">Upskill</span>
        </span>
        <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Learning Engine
        </span>
      </div>
    </div>
  );

  if (asLink && !onClick) {
    return (
      <Link
        to="/"
        className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        aria-label="AI Upskill Home"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 cursor-pointer"
      aria-label="AI Upskill Home"
    >
      {content}
    </button>
  );
}

import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ onClick, asLink = true }) {
  const content = (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm text-white">
        <BookOpen size={18} className="text-white" />
      </span>
      <div className="flex flex-col text-left leading-none">
        <span className="text-lg font-extrabold tracking-tight text-slate-900">
          SkillPath
        </span>
        <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase mt-0.5">
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
        aria-label="SkillPath Home"
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
      aria-label="SkillPath Home"
    >
      {content}
    </button>
  );
}

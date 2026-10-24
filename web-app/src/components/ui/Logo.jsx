import { Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ onClick, asLink = true }) {
  const content = (
    <>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-yellow-300 text-green-950">
        <Target size={21} />
      </span>
      <span className="text-xl">
        AiUpskilling Platform<span className="text-green-700">.</span>
      </span>
    </>
  );

  if (asLink && !onClick) {
    return (
      <Link to="/" className="inline-flex items-center gap-2.5 font-extrabold tracking-tight text-green-950" aria-label="SkillPath home">
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className="inline-flex items-center gap-2.5 font-extrabold tracking-tight text-green-950"
      aria-label="SkillPath home"
    >
      {content}
    </button>
  );
}

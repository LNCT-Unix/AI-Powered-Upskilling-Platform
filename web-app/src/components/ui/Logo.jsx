import { Link } from 'react-router-dom';

export default function Logo({ onClick, asLink = true }) {
  const content = (
    <div className="flex items-center gap-3 select-none">
      <img
        src="/octobyte-logo.png"
        alt="octoByte Logo"
        className="h-11 w-auto max-w-[64px] object-contain drop-shadow-xs transition-transform hover:scale-105"
      />
      <div className="flex flex-col text-left leading-none">
        <span className="text-xl font-black tracking-tight font-sans">
          <span className="text-[#2F2A3E]">octo</span>
          <span className="text-[#7C5CFA]">Byte</span>
        </span>
        <span className="text-[9.5px] font-extrabold tracking-widest text-[#FF9838] uppercase mt-0.5">
          AI Learning Platform
        </span>
      </div>
    </div>
  );

  if (asLink && !onClick) {
    return (
      <Link
        to="/"
        className="inline-flex items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        aria-label="octoByte Home"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className="inline-flex items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 cursor-pointer"
      aria-label="octoByte Home"
    >
      {content}
    </button>
  );
}

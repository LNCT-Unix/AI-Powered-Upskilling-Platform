import { useState } from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, WifiOff } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Production-grade Route Error Boundary for octoByte.
 * Intercepts any unhandled render or runtime exceptions across the entire app
 * and renders a polished, brand-aligned fallback UI instead of raw browser crash dumps.
 */
export default function RouteErrorBoundary() {
  const error = useRouteError();
  const [showDetails, setShowDetails] = useState(false);

  let title = 'Something went wrong';
  let message = 'An unexpected issue occurred while loading this view.';
  let isNetwork = false;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Page Not Found';
      message = "The screen or resource you requested doesn't exist or has moved.";
    } else {
      title = `Error ${error.status}`;
      message = error.statusText || error.data?.message || message;
    }
  } else if (error instanceof Error) {
    const errMsg = error.message || '';
    if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('Failed to load')) {
      isNetwork = true;
      title = 'Network Connection Issue';
      message = 'Unable to reach the server. If testing on a mobile device without USB, ensure your phone and PC are connected to the same Wi-Fi network.';
    } else {
      message = error.message;
    }
  }

  const handleReload = () => {
    window.location.reload();
  };

  const handleHome = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 text-slate-900 select-none"
      style={{ background: '#F7F3E8' }}
    >
      <div className="w-full max-w-md rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand header */}
        <div className="flex items-center justify-between border-b border-[#E8E0CC] pb-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/octobyte-logo.png"
              alt="octoByte"
              className="h-7 w-auto object-contain"
            />
            <span className="text-sm font-black text-slate-900">
              <span className="text-[#2F2A3E]">octo</span>
              <span className="text-[#7C5CFA]">Byte</span>
            </span>
          </div>
          <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-600">
            {isNetwork ? 'Offline' : 'Error'}
          </span>
        </div>

        {/* Error icon & text */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100/70 border border-rose-200 text-rose-600 shadow-2xs">
            {isNetwork ? <WifiOff size={28} /> : <AlertTriangle size={28} />}
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-[#2F2A3E]">{title}</h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              {message}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            variant="indigo"
            size="md"
            onClick={handleReload}
            className="flex-1 justify-center gap-2 font-bold text-xs shadow-sm"
          >
            <RefreshCw size={14} /> Reload Application
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleHome}
            className="flex-1 justify-center gap-2 font-bold text-xs border border-[#E8E0CC]"
          >
            <Home size={14} /> Go to Dashboard
          </Button>
        </div>

        {/* Collapsible Technical Details for Debugging */}
        <div className="border-t border-[#E8E0CC] pt-3">
          <button
            type="button"
            onClick={() => setShowDetails((p) => !p)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-slate-800 transition"
          >
            <span>Technical diagnostic details</span>
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showDetails && (
            <div className="mt-2 p-3 rounded-2xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-40 break-all space-y-1">
              <p className="text-rose-400 font-bold">{String(error?.name || 'Error')}: {String(error?.message || error)}</p>
              {error?.stack && (
                <p className="text-slate-400 text-[10px] whitespace-pre-wrap">{error.stack.split('\n').slice(0, 5).join('\n')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { Server, Wifi, Usb, Check, RefreshCw, X, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

export default function ServerSwitcherModal({ isOpen, onClose }) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('octobyte_api_url') || 'http://localhost:8080';
      setCurrentUrl(stored);
      setCustomInput(stored);
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (url) => {
    setCustomInput(url);
    setStatusMsg(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatusMsg(null);
    try {
      const target = customInput.trim().replace(/\/+$/, '');
      const res = await fetch(`${target}/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Server reachable! Status: UP (200 OK)' });
      } else {
        setStatusMsg({ type: 'error', text: `Server returned status ${res.status}` });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Connection failed: ${err.message || 'Network unreachable'}` });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndReload = () => {
    const cleanUrl = customInput.trim().replace(/\/+$/, '');
    if (cleanUrl) {
      localStorage.setItem('octobyte_api_url', cleanUrl);
    } else {
      localStorage.removeItem('octobyte_api_url');
    }
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-3xl border border-[#E8E0CC] bg-[#FFFDF7] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#E8E0CC] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#EFEAFC] text-[#7C5CFA]">
              <Server size={18} />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-[#2F2A3E]">Gateway Connection</h3>
              <p className="text-[11px] text-[#6E6880]">Configure target Spring Boot API</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quick Presets
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleSelectPreset('http://localhost:8080')}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                customInput === 'http://localhost:8080'
                  ? 'border-[#7C5CFA] bg-[#EFEAFC]/50 text-[#7C5CFA] font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <Usb size={14} className="shrink-0 text-slate-500" />
              <div className="min-w-0">
                <p className="font-bold truncate">USB Tether</p>
                <p className="text-[10px] text-slate-400 truncate">localhost:8080</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('http://10.71.104.22:8080')}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                customInput === 'http://10.71.104.22:8080'
                  ? 'border-[#7C5CFA] bg-[#EFEAFC]/50 text-[#7C5CFA] font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <Wifi size={14} className="shrink-0 text-slate-500" />
              <div className="min-w-0">
                <p className="font-bold truncate">Wi-Fi LAN</p>
                <p className="text-[10px] text-slate-400 truncate">10.71.104.22</p>
              </div>
            </button>
          </div>
        </div>

        {/* Custom Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Backend URL
          </label>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="http://192.168.1.X:8080"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-[#7C5CFA] focus:outline-none"
          />
        </div>

        {statusMsg && (
          <div
            className={`rounded-xl p-2.5 text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <Check size={14} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={14} className="text-rose-600 shrink-0" />
            )}
            <span className="truncate">{statusMsg.text}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            loading={testing}
            className="flex-1 justify-center text-xs"
          >
            <RefreshCw size={13} /> Test Ping
          </Button>

          <Button
            type="button"
            variant="indigo"
            size="sm"
            onClick={handleSaveAndReload}
            className="flex-1 justify-center text-xs"
          >
            Save & Connect
          </Button>
        </div>
      </div>
    </div>
  );
}

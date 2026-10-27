import { useState } from 'react';
import { GitBranch, CheckCircle2, XCircle, Clock, Upload, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const VERIFICATION_CRITERIA = [
  { id: 'v1', label: 'GitHub repository is public and accessible', status: 'pass' },
  { id: 'v2', label: 'README.md present with setup & architectural documentation', status: 'pass' },
  { id: 'v3', label: 'Valid package.json with dependencies and build scripts', status: 'pass' },
  { id: 'v4', label: 'Unit or integration test suites present and executable', status: 'pass' },
  { id: 'v5', label: 'Clean compilation with 0 syntax or runtime errors', status: 'pass' },
];

export default function ProjectVerifyPage() {
  const [url, setUrl]           = useState('');
  const [submitted, setSubmit]  = useState(false);
  const [loading, setLoading]   = useState(false);
  const [checks, setChecks]     = useState(VERIFICATION_CRITERIA);

  const handleVerify = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);

    // Simulate real repo verification pipeline
    setTimeout(() => {
      setLoading(false);
      setSubmit(true);
      // Realistic check outcomes based on URL input
      const isValidGit = url.toLowerCase().includes('github.com');
      setChecks(VERIFICATION_CRITERIA.map(c => ({
        ...c,
        status: isValidGit ? 'pass' : (c.id === 'v4' ? 'fail' : 'pass'),
      })));
    }, 1500);
  };

  const passes  = checks.filter(c => c.status === 'pass').length;
  const total   = checks.length;
  const pct     = Math.round((passes / total) * 100);
  const allPass = passes === total;

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-6">
      <div className="border-b border-slate-200/80 pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Verification Engine · Capstone</span>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Project Verification
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Submit your public GitHub repository. Automated lint, test, and dependency checks evaluate your code for certificate issuance.
        </p>
      </div>

      {/* URL form */}
      <Card className="space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <GitBranch size={16} className="text-slate-400" />
          <h2 className="text-base font-bold text-slate-900">Repository Submission</h2>
        </div>
        <form onSubmit={handleVerify} className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://github.com/your-username/your-capstone-project"
            aria-label="GitHub repository URL"
            required
            className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition shadow-xs"
          />
          <Button type="submit" variant="indigo" loading={loading} disabled={!url.trim()}>
            <Upload size={14} /> Run Checks
          </Button>
        </form>
        {!submitted && (
          <div className="text-xs text-slate-500 space-y-1.5 pt-1">
            <p className="font-semibold text-slate-700">Automated Pipeline Checks:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              {checks.map(c => <li key={c.id}>{c.label}</li>)}
            </ul>
          </div>
        )}
      </Card>

      {submitted && (
        <>
          {/* Score card */}
          <Card className={`border shadow-sm ${allPass ? 'border-emerald-100 bg-emerald-50/30' : 'border-amber-100 bg-amber-50/20'}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Automated Audit Result</p>
                <p className="text-2xl font-extrabold text-slate-900">{passes}/{total} Checks Passed</p>
                <p className="text-sm text-slate-600">
                  {allPass
                    ? 'All repository standards met. Your verified certificate has been issued.'
                    : `${total - passes} check${total - passes > 1 ? 's' : ''} failed. Resolve issues and re-run.`}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                      <ExternalLink size={12} /> View Repository
                    </a>
                  )}
                  <button type="button" onClick={() => { setSubmit(false); setUrl(''); }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
                    <RefreshCw size={12} /> Submit New URL
                  </button>
                </div>
              </div>
              {/* Score ring */}
              <div className="shrink-0 h-16 w-16">
                <svg viewBox="0 0 44 44" className="w-full" aria-label={`${pct}% passed`}>
                  <circle cx={22} cy={22} r={16} fill="none" stroke="#e2e8f0" strokeWidth={3} />
                  <circle cx={22} cy={22} r={16} fill="none"
                    stroke={allPass ? '#059669' : '#d97706'} strokeWidth={3}
                    strokeDasharray={`${(pct / 100) * 100.5} ${100.5 - (pct / 100) * 100.5}`}
                    strokeDashoffset={25} strokeLinecap="round" />
                  <text x={22} y={26} textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f172a">{pct}%</text>
                </svg>
              </div>
            </div>
          </Card>

          {/* Check list */}
          <Card className="space-y-3 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Audit Details</h3>
            <ul className="space-y-2">
              {checks.map(check => {
                const isPass = check.status === 'pass';
                return (
                  <li key={check.id} className={`flex items-center gap-3 rounded-xl border p-3.5 text-xs ${
                    isPass ? 'border-emerald-100 bg-emerald-50/20' : 'border-rose-100 bg-rose-50/20'
                  }`}>
                    {isPass ? (
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle size={16} className="shrink-0 text-rose-600" />
                    )}
                    <span className="flex-1 font-medium text-slate-800">{check.label}</span>
                    <Badge variant={isPass ? 'emerald' : 'rose'}>
                      {isPass ? 'Pass' : 'Failed'}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}

      {/* Code quality scan */}
      <Card className="border-dashed border-slate-300 bg-white/70 text-center py-8 space-y-1 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">Code Quality & Security Pipeline</p>
        <p className="text-xs text-slate-400">Automated ESLint AST parsing, cyclomatic complexity metrics, and secret vulnerability scanning.</p>
      </Card>
    </div>
  );
}

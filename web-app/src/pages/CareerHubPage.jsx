import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, TrendingUp, ArrowRight, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

function MatchRing({ pct, size = 56 }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const color = pct >= 70 ? '#059669' : pct >= 50 ? '#4f46e5' : '#d97706';

  return (
    <svg width={size} height={size} aria-label={`${pct}% match`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={4.5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4.5}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      <text x={size/2} y={size/2 + 4} textAnchor="middle"
        fontSize="10" fontWeight="800" fill={color} fontFamily="Inter,sans-serif">
        {pct}%
      </text>
    </svg>
  );
}

const INDUSTRY_TARGET_ROLES = [
  {
    id: 'role-1',
    role: 'Full-Stack Software Engineer',
    company: 'EPAM Systems',
    location: 'Hyderabad / Bengaluru (Hybrid)',
    salary: '10–22 LPA',
    posted: 'Verified Partner Role',
    requiredSkills: ['HTTP / REST API Fundamentals', 'Database Indexing & B-Trees', 'Distributed Caching with Redis', 'React Core'],
  },
  {
    id: 'role-2',
    role: 'Backend Platform Engineer',
    company: 'Cloud Scale Product Team',
    location: 'Bengaluru (Remote)',
    salary: '14–26 LPA',
    posted: 'Direct Hire',
    requiredSkills: ['Database Indexing & B-Trees', 'Distributed Caching with Redis', 'Consensus Protocols & Paxos'],
  },
  {
    id: 'role-3',
    role: 'Frontend Application Specialist',
    company: 'Fintech Innovation Lab',
    location: 'Pune / Mumbai (Hybrid)',
    salary: '8–16 LPA',
    posted: 'Active Requirement',
    requiredSkills: ['HTTP / REST API Fundamentals', 'React Core', 'State Architecture'],
  },
];

export default function CareerHubPage() {
  const navigate = useNavigate();

  // Load real assessment result from storage
  const assessmentResult = useMemo(() => {
    try {
      const raw = localStorage.getItem('skillpath_assessment_result');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const readyNames = useMemo(() => {
    if (!assessmentResult?.skills) return [];
    return assessmentResult.skills
      .filter(s => s.state === 'MASTERED' || s.status === 'unlocked' || s.state === 'READY_TO_LEARN')
      .map(s => s.name.toLowerCase());
  }, [assessmentResult]);

  // Compute live match statistics against verified skills
  const matchedJobs = useMemo(() => {
    return INDUSTRY_TARGET_ROLES.map(job => {
      const haveSkills = job.requiredSkills.filter(req =>
        readyNames.some(m => m.includes(req.toLowerCase()) || req.toLowerCase().includes(m))
      );
      const missingSkills = job.requiredSkills.filter(req => !haveSkills.includes(req));
      const match = Math.max(30, Math.round((haveSkills.length / job.requiredSkills.length) * 100));

      return {
        ...job,
        match,
        haveSkills,
        missingSkills,
      };
    });
  }, [readyNames]);

  const [selectedId, setSelectedId] = useState(matchedJobs[0].id);

  const selectedJob = useMemo(() => {
    return matchedJobs.find(j => j.id === selectedId) || matchedJobs[0];
  }, [matchedJobs, selectedId]);

  const best = useMemo(() => {
    return matchedJobs.reduce((a, b) => (a.match > b.match ? a : b));
  }, [matchedJobs]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Verified Careers Hub</span>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">Career & Role Readiness</h1>
        <p className="mt-1 text-sm text-slate-500">
          Target industry job specifications matched dynamically against your verified competencies.
        </p>
      </div>

      {/* Best match banner */}
      <div className="animate-slide-up delay-75 rounded-2xl border border-slate-100 bg-white shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 shrink-0">
            <TrendingUp size={18} className="text-indigo-600" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Top Matched Role</p>
            <p className="text-sm font-extrabold text-slate-900">{best.role} at {best.company}</p>
            <p className="text-xs text-slate-500">
              {best.missingSkills.length > 0
                ? `Learn ${best.missingSkills.length} more skill${best.missingSkills.length > 1 ? 's' : ''} to unlock 100% readiness.`
                : '100% prerequisite match achieved!'}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <MatchRing pct={best.match} size={64} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Job cards */}
        <div className="lg:col-span-7 space-y-3">
          {matchedJobs.map((job, i) => (
            <button
              key={job.id}
              type="button"
              onClick={() => setSelectedId(job.id)}
              className={`animate-slide-left w-full text-left rounded-2xl border p-4 sm:p-5 transition-all duration-200 card-hover cursor-pointer ${
                selectedId === job.id
                  ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/30 shadow-md'
                  : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-extrabold text-indigo-600">
                      {job.company[0]}
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 truncate">{job.role}</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">{job.company}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
                    <span className="flex items-center gap-1">₹{job.salary}</span>
                    <span>{job.posted}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {job.requiredSkills.map(s => {
                      const isHave = job.haveSkills.includes(s);
                      return (
                        <span
                          key={s}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            isHave ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isHave ? '✓ ' : ''}{s}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <MatchRing pct={job.match} size={52} />
              </div>
            </button>
          ))}
        </div>

        {/* Side detail panel */}
        <div className="lg:col-span-5 space-y-4 animate-slide-right">
          {/* Role header */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-base font-extrabold text-slate-900">{selectedJob.role}</p>
                <p className="text-sm text-slate-500 font-semibold">{selectedJob.company} · {selectedJob.location}</p>
                <p className="mt-1 text-sm font-bold text-slate-700">₹{selectedJob.salary}</p>
              </div>
              <MatchRing pct={selectedJob.match} size={60} />
            </div>
            <p className="text-xs font-bold text-indigo-600">
              {selectedJob.match}% Verified Requirements Met
            </p>
          </div>

          {/* Skill gap analysis */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Competency Match Analysis</h3>
            <div className="space-y-2">
              {selectedJob.haveSkills.map(s => (
                <div key={s} className="flex items-center gap-2.5 text-xs">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span className="font-medium text-slate-700">{s}</span>
                  <span className="text-emerald-600 font-semibold ml-auto">Verified</span>
                </div>
              ))}
              {selectedJob.missingSkills.map(s => (
                <div key={s} className="flex items-center gap-2.5 text-xs">
                  <AlertCircle size={14} className="text-amber-500 shrink-0" />
                  <span className="font-medium text-slate-500">{s}</span>
                  <button
                    type="button"
                    onClick={() => navigate('/roadmap')}
                    className="text-indigo-600 font-bold ml-auto hover:underline text-[10px] cursor-pointer"
                  >
                    Add to roadmap
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => navigate('/roadmap')}
            className="w-full flex items-center justify-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-xs cursor-pointer"
          >
            Target Missing Skills <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

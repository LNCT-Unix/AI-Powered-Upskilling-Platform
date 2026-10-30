import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  FileText,
  AlertCircle,
  Network,
  Compass,
} from 'lucide-react';
import { assessmentService } from '../services/assessmentService';

export default function TestHistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadHistory() {
      try {
        const data = await assessmentService.getHistory();
        if (!ignore) {
          setHistory(Array.isArray(data) ? data : []);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.warn('Failed to load assessment history:', err);
          setError(err.message || 'Unable to load test history. Please try again.');
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const handleRefresh = () => {
    setLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  const completedTests = history.filter((t) => t.status === 'COMPLETED');
  const latestCompleted = completedTests[0] || null;

  const totalAnswered = completedTests.reduce((acc, t) => acc + (t.itemsAdministered || 0), 0);
  const totalCorrect = completedTests.reduce((acc, t) => acc + (t.correctCount || 0), 0);
  const avgAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const formatDate = (isoString) => {
    if (!isoString) return 'In Progress';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const getLevelColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'ADVANCED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INTERMEDIATE':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'BEGINNER':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const formatTheta = (theta) => {
    if (typeof theta !== 'number') return '0.00';
    return theta > 0 ? `+${theta.toFixed(2)}` : theta.toFixed(2);
  };

  const handleRetest = () => {
    sessionStorage.removeItem('skillpath_assessment_id');
    localStorage.removeItem('skillpath_assessment_result');
    navigate('/assessment');
  };

  return (
    <div className="max-w-[1240px] w-full mx-auto p-4 sm:p-8 space-y-8 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ece5d6] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
            Assessment History
          </h1>
          <p className="text-sm text-[#64748b] mt-1 max-w-2xl leading-relaxed">
            Every adaptive diagnostic test you take is stored in your record. Review past accuracy, ability parameter (θ) calibrations, and detailed skill gap reports.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRetest}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#5b3df5] text-white font-semibold text-sm hover:bg-[#4f33d8] transition shadow-xs cursor-pointer shrink-0"
        >
          <Sparkles size={16} /> Take New Diagnostic Test
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="font-bold underline hover:text-rose-950 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#ece5d6] bg-[#fffdf9] p-5 space-y-1 shadow-2xs">
          <span className="text-xs font-semibold text-[#64748b]">Total Tests Completed</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
            {loading ? '...' : completedTests.length}
          </div>
          <p className="text-[11px] text-[#64748b]">
            {history.length - completedTests.length > 0
              ? `${history.length - completedTests.length} session in-progress`
              : 'All sessions finalized'}
          </p>
        </div>

        <div className="rounded-2xl border border-[#ece5d6] bg-[#fffdf9] p-5 space-y-1 shadow-2xs">
          <span className="text-xs font-semibold text-[#64748b]">Latest Ability Parameter (θ)</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#5b3df5]">
            {loading ? '...' : latestCompleted ? `θ = ${formatTheta(latestCompleted.theta)}` : 'Baseline (0.0)'}
          </div>
          <p className="text-[11px] text-[#64748b]">
            {latestCompleted ? `${latestCompleted.level || 'Intermediate'} ability band` : 'Complete test to calibrate'}
          </p>
        </div>

        <div className="rounded-2xl border border-[#ece5d6] bg-[#fffdf9] p-5 space-y-1 shadow-2xs">
          <span className="text-xs font-semibold text-[#64748b]">Average Accuracy</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#059669]">
            {loading ? '...' : `${avgAccuracy}%`}
          </div>
          <p className="text-[11px] text-[#64748b]">
            {totalCorrect} of {totalAnswered} items correct across tests
          </p>
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[#0f172a]">
            Past Diagnostic Sessions ({history.length})
          </h2>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5b3df5] hover:text-[#4f33d8] transition cursor-pointer"
          >
            <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#ece5d6] bg-[#fffdf9] p-12 text-center text-[#64748b] space-y-3">
            <RotateCcw size={28} className="animate-spin text-[#5b3df5] mx-auto" />
            <p className="text-sm font-semibold">Loading test history from database...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-[#ece5d6] bg-[#fffdf9] p-12 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-[#ece8ff] text-[#5b3df5] flex items-center justify-center mx-auto">
              <Compass size={32} />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base font-bold text-[#0f172a]">No diagnostic tests recorded yet</h3>
              <p className="text-xs sm:text-sm text-[#64748b]">
                Complete your first adaptive diagnostic screening to evaluate your ability score, map knowledge gaps, and unlock your roadmap.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRetest}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5b3df5] text-white font-semibold text-xs sm:text-sm hover:bg-[#4f33d8] transition shadow-xs cursor-pointer"
            >
              Start Diagnostic Test <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((item, index) => {
              const isCompleted = item.status === 'COMPLETED';
              const accuracy = item.accuracyPct ?? (item.itemsAdministered > 0 ? Math.round((100 * item.correctCount) / item.itemsAdministered) : 0);

              return (
                <div
                  key={item.assessmentId || index}
                  className="rounded-2xl border border-[#ece5d6] bg-[#fffdf9] p-5 sm:p-6 transition hover:border-[#d5cfc5] shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f1ece0] text-xs font-extrabold text-[#0f172a]">
                        #{history.length - index}
                      </span>
                      <h3 className="text-base font-bold text-[#0f172a]">
                        {item.trackName || 'Backend Engineering'}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          isCompleted
                            ? 'bg-[#dcf7ec] text-[#059669] border-[#9be3c6]'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {item.status || 'COMPLETED'}
                      </span>
                      {item.level && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getLevelColor(
                            item.level
                          )}`}
                        >
                          {item.level}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#64748b] font-medium">
                      {formatDate(item.completedAt)}
                    </div>
                  </div>

                  {/* Metrics bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f6f1e7] rounded-xl p-3.5 text-xs">
                    <div>
                      <span className="text-[#64748b] block text-[11px]">Ability Parameter</span>
                      <strong className="text-[#5b3df5] text-sm font-extrabold">
                        {item.theta !== null && item.theta !== undefined ? `θ = ${formatTheta(item.theta)}` : 'In Progress'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[#64748b] block text-[11px]">Accuracy</span>
                      <strong className="text-[#059669] text-sm font-extrabold">
                        {accuracy}%
                      </strong>
                    </div>

                    <div>
                      <span className="text-[#64748b] block text-[11px]">Questions Correct</span>
                      <strong className="text-[#0f172a] text-sm font-extrabold">
                        {item.correctCount || 0} / {item.itemsAdministered || 0}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[#64748b] block text-[11px]">Termination Reason</span>
                      <span className="text-[#0f172a] font-semibold truncate block">
                        {item.stopReason ? item.stopReason.replace(/_/g, ' ') : isCompleted ? 'Completed' : 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#ece5d6]/70">
                    <span className="text-[11px] font-mono text-[#64748b]">
                      ID: {item.assessmentId ? item.assessmentId.slice(0, 13) + '...' : 'CAT'}
                    </span>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => navigate('/graph')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#ece5d6] bg-white text-xs font-semibold text-[#0f172a] hover:bg-[#f6f1e7] transition cursor-pointer"
                      >
                        <Network size={13} /> View Graph
                      </button>

                      {isCompleted ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/assessment?id=${item.assessmentId}`)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#5b3df5] text-white text-xs font-bold hover:bg-[#4f33d8] transition shadow-2xs cursor-pointer"
                        >
                          <FileText size={13} /> View Skill Report <ArrowRight size={13} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            sessionStorage.setItem('skillpath_assessment_id', item.assessmentId);
                            navigate('/assessment');
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition shadow-2xs cursor-pointer"
                        >
                          Resume Test <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

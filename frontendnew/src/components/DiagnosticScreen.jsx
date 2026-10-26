import React, { useState } from 'react';
import { HelpCircle, CheckCircle, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { diagnosticQuestions } from '../data/platformData.js';

export default function DiagnosticScreen({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(2);
  const [isFinished, setIsFinished] = useState(false);

  const q = diagnosticQuestions[currentIndex];

  const handleNext = () => {
    if (currentIndex < diagnosticQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      
      {!isFinished ? (
        <>
          {/* Diagnostic Test Header */}
          <div className="flex items-center justify-between bg-slate-900 border border-cyan-500/20 p-4 rounded-2xl">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                QUESTION {currentIndex + 1} OF {diagnosticQuestions.length}
              </span>
              <p className="text-xs text-slate-400 mt-1">{q.topic}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">Timer: 45s</span>
              <button className="text-xs text-cyan-400 hover:underline">Select Option to Proceed</button>
            </div>
          </div>

          {/* Question Box */}
          <div className="bg-slate-900/80 border border-cyan-500/30 rounded-3xl p-8 shadow-cyan-glow space-y-6">
            <h3 className="text-lg font-bold text-white leading-relaxed">
              {q.question}
            </h3>

            {/* Options List */}
            <div className="space-y-3">
              {q.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    selectedOption === opt.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-cyan-glow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs shrink-0 ${
                    selectedOption === opt.id ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-700 text-slate-400'
                  }`}>
                    {opt.id}
                  </span>
                  <span className="text-xs leading-relaxed mt-0.5">{opt.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">42 Upskilling Platform • 10 Dynamic Diagnostic Assessment</span>
            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                selectedOption
                  ? 'bg-cyan-500 text-slate-950 shadow-cyan-glow hover:bg-cyan-400'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>{currentIndex < diagnosticQuestions.length - 1 ? 'Confirm & Next Question' : 'Submit & Generate Report'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        /* Diagnostic Assessment Results Banner */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-cyan-400 p-8 rounded-3xl shadow-cyan-glow space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20 uppercase">
                  DIAGNOSTIC COMPLETE • Backend Engineering Track
                </span>
                <h2 className="text-3xl font-black text-white mt-2">Diagnostic Readiness: 20%</h2>
                <p className="text-xs text-slate-400 mt-1">10-Question diagnostic assessment completed in 2m 15s.</p>
              </div>

              <button
                onClick={onComplete}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-cyan-glow transition-all"
              >
                Proceed to My Roadmap →
              </button>
            </div>

            {/* Score Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-mono">TOTAL SCORE</span>
                <p className="text-xl font-bold font-mono text-cyan-400 mt-1">{score} / 10</p>
                <span className="text-[10px] text-slate-500">Core Concepts</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-mono">AVG TIME / Q</span>
                <p className="text-xl font-bold font-mono text-white mt-1">13s</p>
                <span className="text-[10px] text-slate-500">Fast Response</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-mono">TOPIC GAPS</span>
                <p className="text-xl font-bold font-mono text-cyan-400 mt-1">8 Gaps</p>
                <span className="text-[10px] text-slate-500">Targeted for Roadmap</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-mono">CALIBRATED LEVEL</span>
                <p className="text-xl font-bold font-mono text-white mt-1">Beginner</p>
                <span className="text-[10px] text-slate-500">Level 01</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

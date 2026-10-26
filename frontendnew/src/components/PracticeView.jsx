import React, { useState } from 'react';
import { RefreshCw, CheckCircle, RotateCw } from 'lucide-react';
import { flashcards } from '../data/platformData.js';

export default function PracticeView() {
  const [flipped, setFlipped] = useState(false);
  const card = flashcards[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-cyan-500/20 p-6 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            SPACED REPETITION DRILLS
          </span>
          <h2 className="text-xl font-bold text-white mt-1">Practice & Flashcard Drills</h2>
        </div>
        <button className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-300 text-xs rounded-xl flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Take Adaptive Re-Test</span>
        </button>
      </div>

      {/* Flashcard Box */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="cursor-pointer bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-8 min-h-[260px] flex flex-col justify-between shadow-cyan-glow transition-all hover:border-cyan-400"
      >
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
          <span>{card.category}</span>
          <span className="text-cyan-400 flex items-center gap-1">
            <RotateCw className="w-3.5 h-3.5" /> Click card to {flipped ? 'see question' : 'reveal answer'}
          </span>
        </div>

        <div className="my-6 text-center space-y-3">
          <p className="text-xs uppercase font-mono text-slate-500 tracking-wider">
            {flipped ? 'ANSWER' : 'QUESTION'}
          </p>
          <h3 className="text-lg font-bold text-white leading-relaxed">
            {flipped ? card.answer : card.question}
          </h3>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Card 1 of 4</span>
          <span>Next interval: 2 days</span>
        </div>
      </div>

      {/* Self Assessment Buttons */}
      <div className="flex justify-center gap-4">
        <button className="px-6 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold">
          Still Learning
        </button>
        <button className="px-6 py-2.5 bg-cyan-500 text-slate-950 shadow-cyan-glow hover:bg-cyan-400 rounded-xl text-xs font-bold">
          Mastered (+10 XP)
        </button>
      </div>
    </div>
  );
}

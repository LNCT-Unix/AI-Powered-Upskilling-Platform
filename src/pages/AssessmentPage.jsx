import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { questions } from '../data/mockData';

export default function AssessmentPage() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const score = questions.filter((q, i) => answers[i] === q.answer).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-bold text-green-800">PRACTICE MODE</p>
        <h1 className="mt-1 text-2xl font-extrabold text-green-950">Diagnostic assessment</h1>
        <p className="mt-2 text-sm text-slate-500">
          Answer these sample questions to check your current understanding.
        </p>
      </div>

      <Card>
        <div className="mb-5 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">Your progress</span>
          <span className="text-slate-500">
            {Object.keys(answers).length} of {questions.length} answered
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-green-700 transition-all duration-300"
            style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
          />
        </div>
      </Card>

      {questions.map((q, i) => (
        <Card key={q.topic}>
          <p className="text-xs font-bold uppercase tracking-wider text-green-800">
            Question {i + 1} · {q.topic}
          </p>
          <h2 className="mt-3 font-bold text-green-950">{q.question}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {q.options.map((option, j) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                  answers[i] === j
                    ? 'border-green-700 bg-green-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name={`q${i}`}
                  checked={answers[i] === j}
                  disabled={submitted}
                  onChange={() => setAnswers((p) => ({ ...p, [i]: j }))}
                  className="accent-green-800"
                />
                {option}
              </label>
            ))}
          </div>
          {submitted && (
            <p
              className={`mt-3 text-sm font-semibold ${
                answers[i] === q.answer ? 'text-green-800' : 'text-amber-800'
              }`}
            >
              {answers[i] === q.answer ? '✓ Correct answer' : '✗ Correct answer: ' + q.options[q.answer]}
            </p>
          )}
        </Card>
      ))}

      {submitted ? (
        <Card className="border-green-200 bg-green-50">
          <p className="font-bold text-green-950">
            Assessment complete: {score}/{questions.length} correct ({Math.round((score / questions.length) * 100)}%)
          </p>
          <p className="mt-1 text-sm text-green-900">
            This is a local practice result, not an AI-generated or backend assessment.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
          >
            Try again
          </Button>
        </Card>
      ) : (
        <Button
          disabled={Object.keys(answers).length !== questions.length}
          onClick={() => setSubmitted(true)}
        >
          Submit assessment <ArrowRight size={16} />
        </Button>
      )}
    </div>
  );
}

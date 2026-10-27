import { useState, useRef } from 'react';
import { X, Send, ExternalLink, AlertTriangle } from 'lucide-react';

const SAMPLE_RESPONSES = [
  {
    query: 'closure',
    answer: 'A closure is a function that retains access to its lexical environment even after the outer function has finished executing. This means the inner function can read and modify variables from the outer scope.',
    sources: [
      { title: 'MDN: Closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures' },
      { title: 'JavaScript.info: Closure', url: 'https://javascript.info/closure' },
    ],
  },
  {
    query: 'sql join',
    answer: 'A JOIN combines rows from two or more tables based on a related column. INNER JOIN returns rows with matches in both tables. LEFT JOIN returns all rows from the left table, even if there\'s no match on the right.',
    sources: [
      { title: 'NPTEL: SQL Fundamentals', url: 'https://nptel.ac.in' },
      { title: 'W3Schools: SQL Joins', url: 'https://www.w3schools.com/sql/sql_join.asp' },
    ],
  },
];

const FALLBACK = 'I couldn\'t find a confident answer in the trusted course materials. Try rephrasing, or check the linked resources in your current roadmap milestone.';

/**
 * AskAIPanel — floating contextual AI assistant
 * Shows sources under answers. Clear fallback when no trusted content is found.
 */
export default function AskAIPanel({ onClose }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Ask me anything about your current topic. I\'ll answer from the course materials and flag when I\'m unsure.' }
  ]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setQuery('');
    setLoading(true);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));

    const match = SAMPLE_RESPONSES.find((r) =>
      q.toLowerCase().includes(r.query)
    );

    if (match) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: match.answer, sources: match.sources },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: FALLBACK, isFallback: true },
      ]);
    }

    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div
      className="w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg flex flex-col"
      style={{ height: '400px' }}
      role="complementary"
      aria-label="Ask AI assistant"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-muted)] px-4 py-3 shrink-0">
        <div>
          <p className="text-sm font-bold text-[var(--color-text-primary)]">Ask AI</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">Answers from course materials only</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-warm)]"
          aria-label="Close AI panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[var(--color-teal-700)] text-white rounded-br-sm'
                  : msg.isFallback
                  ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-sm'
                  : 'bg-[var(--color-surface-warm)] border border-[var(--color-border-muted)] text-[var(--color-text-body)] rounded-bl-sm'
              }`}
            >
              {msg.isFallback && (
                <div className="flex items-center gap-1.5 mb-1.5 font-semibold text-amber-700">
                  <AlertTriangle size={12} aria-hidden="true" />
                  Couldn't find a trusted answer
                </div>
              )}
              <p>{msg.text}</p>
              {msg.sources && (
                <div className="mt-2 border-t border-[var(--color-border-muted)] pt-1.5 space-y-1">
                  <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Sources</p>
                  {msg.sources.map((s) => (
                    <a
                      key={s.url}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[var(--color-teal-700)] hover:underline text-[10px]"
                    >
                      <ExternalLink size={9} aria-hidden="true" />
                      {s.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--color-surface-warm)] border border-[var(--color-border-muted)] rounded-xl rounded-bl-sm px-3 py-2">
              <div className="flex gap-1" aria-label="AI is thinking">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)]"
                    style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-[var(--color-border-muted)] p-3 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about closures, SQL joins…"
            aria-label="Ask AI a question"
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-3 py-2 text-xs text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-teal-700)]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            aria-label="Send question"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-teal-700)] text-white transition-colors hover:bg-[var(--color-teal-800)] disabled:opacity-50 disabled:pointer-events-none shrink-0"
          >
            <Send size={14} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}

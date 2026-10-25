import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Video,
  Code2,
  Sparkles,
  Mic,
  MicOff,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Play,
  Check,
  Award,
  Layers,
  Flame,
  Volume2
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { roadmapItems } from '../data/mockData';
import { useLanguage } from '../hooks/useLanguage';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

// Curated content database for learning workspace
const TOPIC_CONTENT_REGISTRY = {
  'lexical-scope-closures': {
    title: 'Lexical Scope & Advanced Closures',
    topic: 'JavaScript Fundamentals',
    difficulty: 'Intermediate',
    xpReward: 150,
    duration: '25 min',
    summary:
      'Understand execution contexts, variable shadowing, call stack lifecycles, and how lexical closures encapsulate state in modern frontend architecture.',
    docContent: {
      intro:
        'A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment). In JavaScript, closures are created every time a function is created, at function creation time.',
      codeSample: `function createCounter(initialValue = 0) {
  let count = initialValue; // Enclosed lexical state

  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
  };
}

const counter = createCounter(10);
console.log(counter.increment()); // 11
console.log(counter.getCount());  // 11`,
      keyTakeaways: [
        'Functions retain access to outer variables even after the outer function has returned.',
        'Closures form the underlying runtime mechanic of custom React hooks (e.g. useState).',
        'Stale closures occur when effect or callback dependencies are improperly omitted.',
      ],
    },
    video: {
      title: 'Deep Dive: V8 Call Stack, Scopes & Memory Leak Traps',
      channel: 'Engineering Architecture COE',
      duration: '18:42',
      chapters: [
        { time: '00:00', title: 'Introduction & Lexical Scopes' },
        { time: '04:15', title: 'V8 Heap Memory Allocation' },
        { time: '09:30', title: 'Closure Mechanics in React Custom Hooks' },
        { time: '14:50', title: 'Memory Leaks & Accidental Retentions' },
      ],
    },
    exercise: {
      instructions:
        'Implement a memoize(fn) higher-order function that caches results based on arguments using closures.',
      initialCode: `function memoize(fn) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}`,
      testInput: 'memoize(square)(5)',
      expectedOutput: '25 (cached on 2nd call)',
    },
    quizQuestions: [
      {
        id: 1,
        question: 'When is a closure created in JavaScript execution?',
        options: [
          'When the outer function is garbage collected',
          'At function definition time within its lexical environment',
          'Only when returning an anonymous arrow function',
          'When using the `async` keyword',
        ],
        correct: 1,
        explanation: 'Closures are bound at function creation time based on lexical nesting.',
      },
      {
        id: 2,
        question: 'What is a major risk of holding unneeded references in an active closure?',
        options: [
          'Immediate compiler type error',
          'Unreleased heap memory leading to memory leaks',
          'Corrupted browser local storage',
          'Infinite loops in microtasks',
        ],
        correct: 1,
        explanation: 'Enclosed variables stay retained in the V8 heap as long as the inner function reference is reachable.',
      },
      {
        id: 3,
        question: 'How do React custom hooks utilize JavaScript closures?',
        options: [
          'They bypass JavaScript functions entirely',
          'They enclose the fiber dispatch function and state index during rendering',
          'They compile to C++ WebAssembly',
          'They use global window properties',
        ],
        correct: 1,
        explanation: 'Hooks rely on closure environments tied to the currently rendering Fiber cell.',
      },
    ],
  },
  'event-loop-microtasks': {
    title: 'Event Loop, Microtasks & Promises',
    topic: 'Asynchronous Architecture',
    difficulty: 'Intermediate',
    xpReward: 150,
    duration: '35 min',
    summary:
      'Master the orchestration between the call stack, microtask queue (Promise reactions), and macrotask queue (timers, I/O) to prevent UI thread starvation.',
    docContent: {
      intro:
        'The JavaScript runtime is single-threaded with a non-blocking concurrency model. When synchronous code finishes execution, the event loop immediately drains the entire Microtask Queue before scheduling the next Macrotask.',
      codeSample: `console.log('1: Synchronous Stack');

setTimeout(() => {
  console.log('4: Macrotask (Timer)');
}, 0);

Promise.resolve().then(() => {
  console.log('2: Microtask (Promise)');
}).then(() => {
  console.log('3: Microtask Chained');
});

// Output: 1 -> 2 -> 3 -> 4`,
      keyTakeaways: [
        'Microtasks run before UI rendering updates and macrotasks.',
        'queueMicrotask() and Promise callbacks are scheduled as microtasks.',
        'Long-running synchronous loops or recursive microtasks will freeze the UI thread.',
      ],
    },
    video: {
      title: 'Visualizing Event Loop: Macrotasks vs Microtasks in V8',
      channel: 'Advanced Runtime Engineering',
      duration: '22:15',
      chapters: [
        { time: '00:00', title: 'Call Stack & Synchronous Execution' },
        { time: '05:30', title: 'The Microtask Drain Cycle' },
        { time: '12:10', title: 'Browser Render Steps & requestAnimationFrame' },
        { time: '18:00', title: 'Preventing UI Freezes' },
      ],
    },
    exercise: {
      instructions:
        'Predict and verify the execution sequence of mixed timers and Promise reactions.',
      initialCode: `async function asyncFlow() {
  console.log('A');
  await Promise.resolve();
  console.log('B');
}

console.log('Start');
asyncFlow();
setTimeout(() => console.log('Timeout'), 0);
console.log('End');`,
      testInput: 'Console sequence order',
      expectedOutput: 'Start -> A -> End -> B -> Timeout',
    },
    quizQuestions: [
      {
        id: 1,
        question: 'Which queue has execution priority immediately when the call stack clears?',
        options: [
          'Macrotask Queue (setTimeout)',
          'Microtask Queue (Promises, queueMicrotask)',
          'I/O Poller',
          'Garbage Collection Cycle',
        ],
        correct: 1,
        explanation: 'All pending microtasks are drained before any macrotask is processed.',
      },
      {
        id: 2,
        question: 'What occurs if recursive microtasks are scheduled continuously?',
        options: [
          'The browser switches automatically to a background worker',
          'The call stack empties and the UI thread freezes (starvation)',
          'The browser throws an OutOfTimersException',
          'Macrotasks take precedence automatically',
        ],
        correct: 1,
        explanation: 'Continuous microtask scheduling starves the event loop, preventing rendering and macrotask execution.',
      },
      {
        id: 3,
        question: 'Where does an async/await function pause execution at an await expression?',
        options: [
          'It blocks the entire browser process synchronously',
          'It yields control and schedules the remainder as a microtask',
          'It delegates execution to web sockets',
          'It writes to local storage',
        ],
        correct: 1,
        explanation: 'An await expression schedules the rest of the async function as a microtask.',
      },
    ],
  },
};

// Generic fallback content if slug is not explicitly mapped
const DEFAULT_TOPIC_CONTENT = {
  title: 'Engineering Mastery Module',
  topic: 'Software Architecture',
  difficulty: 'Intermediate',
  xpReward: 150,
  duration: '30 min',
  summary:
    'Comprehensive concept deep-dive with curated architectural documentation, lecture walkthrough, and hands-on coding verification.',
  docContent: {
    intro:
      'This study milestone targets deep conceptual rigor and practical mechanics aligned with your customized upskilling roadmap.',
    codeSample: `// Core architectural implementation pattern
export class ModuleService {
  constructor(config) {
    this.config = config;
  }
  execute() {
    return { status: 'OPTIMAL', timestamp: Date.now() };
  }
}`,
    keyTakeaways: [
      'Deconstruct core engineering invariants before applying higher-level abstractions.',
      'Test edge cases, concurrency hazards, and boundary limits.',
      'Verify real-world performance benchmarks under load.',
    ],
  },
  video: {
    title: 'Architectural Implementation Walkthrough',
    channel: 'EPAM Unix Engineering Hub',
    duration: '19:15',
    chapters: [
      { time: '00:00', title: 'System Overview & Problem Statement' },
      { time: '06:00', title: 'Implementation Mechanics' },
      { time: '13:00', title: 'Best Practices & Security Hardening' },
    ],
  },
  exercise: {
    instructions: 'Review the module pattern and verify the execution invariant.',
    initialCode: `function verifyContract() {\n  return true;\n}`,
    testInput: 'verifyContract()',
    expectedOutput: 'true',
  },
  quizQuestions: [
    {
      id: 1,
      question: 'What is the primary architectural benefit of strict modular boundaries?',
      options: [
        'Faster compilation speed only',
        'Separation of concerns, decoupled state, and isolated testability',
        'Elimination of network requests',
        'Automatic cloud deployment',
      ],
      correct: 1,
      explanation: 'Modular design separates concerns and isolates side effects.',
    },
    {
      id: 2,
      question: 'Which verification step guarantees correctness under concurrent workloads?',
      options: [
        'Single-threaded manual clicks',
        'Idempotent handlers and transaction isolation checks',
        'Disabling database indexes',
        'Increasing client-side timeout',
      ],
      correct: 1,
      explanation: 'Idempotency and transaction isolation protect concurrent state transitions.',
    },
  ],
};

export default function LearnWorkspacePage() {
  const { topicSlug } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const currentTopic = useMemo(() => {
    return (
      TOPIC_CONTENT_REGISTRY[topicSlug] || {
        ...DEFAULT_TOPIC_CONTENT,
        title: topicSlug
          ? topicSlug
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')
          : 'Study Workspace',
      }
    );
  }, [topicSlug]);

  const [activeTab, setActiveTab] = useState('docs'); // docs | video | exercise
  const [codeContent, setCodeContent] = useState(currentTopic.exercise.initialCode);
  const [consoleOutput, setConsoleOutput] = useState(null);
  const [isRunningCode, setIsRunningCode] = useState(false);

  // AI Doubt-Solving Assistant State
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text:
        language === 'hi'
          ? `नमस्ते! मैं आपका AI ट्यूटर हूँ। ${currentTopic.title} के बारे में कोई भी प्रश्न पूछें।`
          : language === 'hinglish'
          ? `Hey! Main aapka AI Doubt Assistant hoon. ${currentTopic.title} ke regarding koi bhi doubt puch sakte ho, text ya voice dono mein!`
          : `Hello! I am your in-context AI tutor. Ask me any question about ${currentTopic.title} using text or your microphone.`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Speech Recognition Hook
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } =
    useSpeechRecognition(language);

  // Auto-fill chat input with voice transcript
  if (transcript && transcript !== chatInput) {
    setChatInput(transcript);
  }

  // Quiz Modal State
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Run Code Simulation
  const handleRunCode = () => {
    setIsRunningCode(true);
    setConsoleOutput(null);
    setTimeout(() => {
      setIsRunningCode(false);
      setConsoleOutput({
        status: 'SUCCESS',
        logs: [
          'Execution initialized in sandboxed V8 worker...',
          `Input: ${currentTopic.exercise.testInput}`,
          `Result: ${currentTopic.exercise.expectedOutput}`,
          '✓ All invariant assertions passed.',
        ],
      });
    }, 600);
  };

  // AI Chat Handler
  const handleSendMessage = (textToSend) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    const userMsg = { role: 'user', text: query.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    resetTranscript();
    setIsAiResponding(true);

    setTimeout(() => {
      let aiReply = '';
      if (language === 'hi') {
        aiReply = `मुख्य बिंदु: ${currentTopic.title} में सबसे महत्वपूर्ण नियम यह है कि लेक्सिकल स्कोप और मेमोरी रेफरेंस को ध्यान से संभालना चाहिए।`;
      } else if (language === 'hinglish') {
        aiReply = `Great question! Simple shabdon mein samjhein toh: ${currentTopic.title} ka core rule hai ki execution context aur memory retention ko optimize rakhna zaroori hai. Production mein yeh state leaks ko rokta hai.`;
      } else {
        aiReply = `Great question! In ${currentTopic.title}, the primary invariant is that inner scopes retain the lexical reference to their parent context. In production, this allows encapsulated state while avoiding global pollution.`;
      }

      setChatMessages((prev) => [...prev, { role: 'assistant', text: aiReply }]);
      setIsAiResponding(false);
    }, 700);
  };

  // Handle Quiz Submission & Adaptive Remediation Loop
  const handleSubmitQuiz = () => {
    const questions = currentTopic.quizQuestions;
    let correct = 0;
    questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) correct += 1;
    });

    const scorePct = Math.round((correct / questions.length) * 100);
    setQuizScore(scorePct);
    setQuizSubmitted(true);

    if (scorePct >= 70) {
      // Award XP & mark done in roadmap
      try {
        const savedDone = JSON.parse(localStorage.getItem('skillpath_roadmap_done') || '[]');
        const matchingItem = roadmapItems.find((r) => r.slug === topicSlug);
        if (matchingItem && !savedDone.includes(matchingItem.id)) {
          localStorage.setItem(
            'skillpath_roadmap_done',
            JSON.stringify([...savedDone, matchingItem.id])
          );
        }
      } catch {
        // ignore
      }
    } else {
      // Failed remediation loop: dynamically attach revision module
      try {
        const revisions = JSON.parse(localStorage.getItem('skillpath_roadmap_revisions') || '{}');
        const matchingItem = roadmapItems.find((r) => r.slug === topicSlug);
        if (matchingItem) {
          revisions[matchingItem.id] = true;
          localStorage.setItem('skillpath_roadmap_revisions', JSON.stringify(revisions));
        }
      } catch {
        // ignore
      }
    }
  };

  const handleRetestQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
        <div>
          <Link
            to="/roadmap"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft size={14} /> Back to Learning Roadmap
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="indigo" icon={Sparkles}>
              PHASE 4: STUDY WORKSPACE
            </Badge>
            <Badge variant="neutral">{currentTopic.topic}</Badge>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">{currentTopic.duration}</span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {currentTopic.title}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-1.5 text-xs font-bold text-amber-900">
            <Flame size={15} className="text-amber-600" />
            <span>+{currentTopic.xpReward} XP</span>
          </div>
          <Button
            variant="indigo"
            size="sm"
            onClick={() => setIsQuizOpen(true)}
            className="shadow-sm"
          >
            <Award size={15} /> Complete & Take Topic Quiz
          </Button>
        </div>
      </div>

      {/* Main 2-Column Split: Media Workspace (Left 7 cols) & AI Doubt Assistant (Right 5 cols) */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: Media Workspace Tabs */}
        <div className="lg:col-span-7 space-y-4">
          {/* Workspace Tab Bar */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { id: 'docs', label: 'Documentation & Concepts', icon: BookOpen },
              { id: 'video', label: 'Video Lecture', icon: Video },
              { id: 'exercise', label: 'Interactive Lab', icon: Code2 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                  activeTab === id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: Documentation */}
          {activeTab === 'docs' && (
            <Card className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Concept Guide
                </span>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  {currentTopic.docContent.intro}
                </p>
              </div>

              {/* Code Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-medium text-slate-400">
                  <span>JavaScript (ESM / Node 22)</span>
                  <span>Syntactic mechanics</span>
                </div>
                <pre className="rounded-xl bg-slate-950 p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800">
                  <code>{currentTopic.docContent.codeSample}</code>
                </pre>
              </div>

              {/* Key Takeaways */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-indigo-600" /> Architectural Invariants
                </h2>
                <ul className="space-y-1.5 pt-1">
                  {currentTopic.docContent.keyTakeaways.map((item, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* TAB 2: Video Lecture */}
          {activeTab === 'video' && (
            <Card className="space-y-4">
              <div className="relative aspect-video rounded-xl bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden group border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <button
                  type="button"
                  className="z-10 grid h-14 w-14 place-items-center rounded-full bg-indigo-600 text-white shadow-xl hover:scale-105 transition cursor-pointer"
                >
                  <Play size={24} className="ml-1" />
                </button>
                <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-xs font-medium">
                  <span>{currentTopic.video.title}</span>
                  <span className="bg-slate-900/80 px-2 py-0.5 rounded font-mono">
                    {currentTopic.video.duration}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Lecture Chapters & Timestamps
                </h2>
                <div className="grid gap-1.5">
                  {currentTopic.video.chapters.map((ch) => (
                    <div
                      key={ch.time}
                      className="flex items-center justify-between rounded-lg p-2.5 border border-slate-200/80 bg-slate-50/50 text-xs hover:bg-slate-100 transition"
                    >
                      <span className="font-medium text-slate-800">{ch.title}</span>
                      <span className="font-mono font-bold text-indigo-600">{ch.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* TAB 3: Interactive Code Lab */}
          {activeTab === 'exercise' && (
            <Card className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Hands-On Code Sandbox
                </span>
                <p className="text-xs text-slate-600">{currentTopic.exercise.instructions}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>solution.js</span>
                  <span>Editable Playground</span>
                </div>
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl bg-slate-950 p-4 font-mono text-xs text-indigo-300 leading-relaxed border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCodeContent(currentTopic.exercise.initialCode)}
                >
                  <RotateCcw size={13} /> Reset Boilerplate
                </Button>
                <Button
                  variant="indigo"
                  size="sm"
                  disabled={isRunningCode}
                  onClick={handleRunCode}
                >
                  <Play size={13} /> {isRunningCode ? 'Executing Sandbox...' : 'Run & Verify Code'}
                </Button>
              </div>

              {/* Console Output */}
              {consoleOutput && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1 text-xs font-mono text-emerald-400">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-[11px] text-slate-400">
                    <span>Console Verification Output</span>
                    <span className="text-emerald-400 font-bold">STATUS: OK</span>
                  </div>
                  {consoleOutput.logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Embedded AI Learning Assistant with Voice Recognition */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="flex flex-col h-[600px] justify-between p-4 space-y-4">
            {/* AI Assistant Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white shadow-xs">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-none">
                    AI Doubt Assistant
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Language: <strong className="uppercase text-slate-700">{language}</strong> · Text & Voice
                  </p>
                </div>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {[
                'Explain in simpler terms',
                'Common production pitfalls',
                'Provide code example',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-xl p-3 leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/80'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                    {msg.role === 'user' ? 'You' : 'AI Tutor'}
                  </span>
                </div>
              ))}

              {isAiResponding && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 italic">
                  <Sparkles size={14} className="animate-spin" />
                  <span>Synthesizing explanation...</span>
                </div>
              )}
            </div>

            {/* Voice & Text Chat Input Bar */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              {isListening && (
                <div className="flex items-center gap-2 text-xs text-red-600 font-semibold animate-pulse">
                  <Volume2 size={14} /> Listening to your voice... Speak now
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Voice Recognition Button */}
                {isSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    aria-label={isListening ? 'Stop listening' : 'Start speaking'}
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition cursor-pointer ${
                      isListening
                        ? 'bg-red-50 text-red-600 border-red-300 ring-2 ring-red-200 animate-bounce'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                )}

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder={
                    isListening ? 'Listening...' : 'Ask a doubt or voice question...'
                  }
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />

                <Button
                  variant="indigo"
                  size="sm"
                  disabled={!chatInput.trim() || isAiResponding}
                  onClick={() => handleSendMessage()}
                >
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* TOPIC QUIZ & ADAPTIVE REMEDIATION MODAL */}
      {isQuizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Topic Assessment Evaluation
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {currentTopic.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsQuizOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {!quizSubmitted ? (
              <div className="space-y-5">
                {currentTopic.quizQuestions.map((q, idx) => (
                  <div key={q.id} className="space-y-2 text-xs">
                    <p className="font-bold text-slate-900">
                      Q{idx + 1}. {q.question}
                    </p>
                    <div className="grid gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = quizAnswers[idx] === optIdx;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setQuizAnswers((prev) => ({ ...prev, [idx]: optIdx }))
                            }
                            className={`flex items-center justify-between rounded-lg p-2.5 border text-left font-medium transition cursor-pointer ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && (
                              <CheckCircle2 size={15} className="text-indigo-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" size="sm" onClick={() => setIsQuizOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="indigo"
                    size="sm"
                    disabled={
                      Object.keys(quizAnswers).length <
                      currentTopic.quizQuestions.length
                    }
                    onClick={handleSubmitQuiz}
                  >
                    Submit Evaluation
                  </Button>
                </div>
              </div>
            ) : (
              /* Quiz Result & Adaptive Remediation */
              <div className="space-y-5">
                <div
                  className={`rounded-xl p-5 border text-center space-y-2 ${
                    quizScore >= 70
                      ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                      : 'border-amber-200 bg-amber-50/60 text-amber-950'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {quizScore >= 70 ? 'Milestone Passed! 🎉' : 'Remediation Loop Triggered ⚠️'}
                  </span>
                  <h3 className="text-2xl font-black">Score: {quizScore}%</h3>
                  <p className="text-xs max-w-md mx-auto leading-relaxed">
                    {quizScore >= 70
                      ? `Congratulations! You scored ${quizScore}% on this evaluation. You earned +${currentTopic.xpReward} XP, updated your habit streak, and unlocked your next roadmap milestone!`
                      : 'Score fell below the 70% mastery threshold. To ensure foundational confidence, an adaptive Revision Module has been injected into your roadmap.'}
                  </p>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
                  {quizScore < 70 ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleRetestQuiz}>
                        <RotateCcw size={14} /> Review & Retest
                      </Button>
                      <Button
                        variant="indigo"
                        size="sm"
                        onClick={() => {
                          setIsQuizOpen(false);
                          navigate('/roadmap');
                        }}
                      >
                        View Revision in Roadmap <ArrowRight size={14} />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="indigo"
                      size="sm"
                      onClick={() => {
                        setIsQuizOpen(false);
                        navigate('/roadmap');
                      }}
                    >
                      Return to Roadmap <ArrowRight size={14} />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

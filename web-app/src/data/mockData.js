import {
  Target, Layers3, Map, ChartNoAxesColumnIncreasing,
  Home, ClipboardCheck
} from 'lucide-react';

import heroImage from '../assets/hero.png';

export const HERO_IMAGE = heroImage;

export const skills = [
  { name: 'JavaScript Fundamentals', score: 0, color: 'bg-green-700' },
  { name: 'SQL & Databases', score: 0, color: 'bg-green-600' },
  { name: 'React', score: 0, color: 'bg-yellow-400' },
  { name: 'Data Structures', score: 0, color: 'bg-lime-500' },
  { name: 'System Design', score: 0, color: 'bg-emerald-300' },
];

export const features = [
  { icon: Target, title: 'Diagnostic assessments', text: 'Identify your strengths and discover the concepts that deserve more practice.' },
  { icon: Layers3, title: 'Visual skill graph', text: 'See how skills connect and which prerequisites to learn first.' },
  { icon: Map, title: 'Personalized roadmap', text: 'Explore a practical learning plan based on your goals and skill gaps.' },
  { icon: ChartNoAxesColumnIncreasing, title: 'Progress analytics', text: 'Review sample scores, milestones and your learning progress over time.' },
];

export const steps = [
  ['Assess', 'Try a short topic-based diagnostic to review your current understanding.'],
  ['Discover', 'Explore skill gaps and the prerequisite concepts behind them.'],
  ['Learn', 'Follow a clear roadmap with lessons, practice and estimated durations.'],
  ['Track', 'Review your progress and revisit topics as you improve.'],
];

export const navItems = [
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: Home },
  { id: 'assessment', path: '/assessment', label: 'Assessment', icon: ClipboardCheck },
  { id: 'graph', path: '/graph', label: 'Skill Graph', icon: Layers3 },
  { id: 'roadmap', path: '/roadmap', label: 'Roadmap', icon: Map },
  { id: 'analytics', path: '/analytics', label: 'Analytics', icon: ChartNoAxesColumnIncreasing },
];

export const activities = [
  { id: 1, type: 'assessment', title: 'Completed React Hooks diagnostic', meta: 'Score 78% · 2 hours ago' },
  { id: 2, type: 'lesson', title: 'Finished “Closures in Practice”', meta: 'JavaScript · Yesterday' },
  { id: 3, type: 'assessment', title: 'Completed SQL Joins quiz', meta: 'Score 85% · 2 days ago' },
  { id: 4, type: 'lesson', title: 'Started “Binary Trees Explained”', meta: 'Data Structures · 3 days ago' },
];

export const knowledgeAreas = [
  'Prerequisites & Foundations',
  'Core Conceptual Understanding',
  'Theory & Architecture',
  'Syntax & Mechanics',
  'Practical Problem-Solving',
];

export const questions = [
  // 1. Prerequisites & Foundations
  {
    id: 1,
    topic: 'JavaScript Fundamentals',
    area: 'Prerequisites & Foundations',
    question: 'Which keyword declares a block-scoped variable that can be reassigned in modern JavaScript?',
    options: ['const', 'let', 'var', 'static'],
    answer: 1,
    explanation: '`let` declares block-scoped variables that can be reassigned, whereas `const` cannot be reassigned and `var` is function-scoped.',
  },
  {
    id: 2,
    topic: 'Type Semantics',
    area: 'Prerequisites & Foundations',
    question: 'What is the evaluated output of `typeof null` in standard JavaScript?',
    options: ['"null"', '"undefined"', '"object"', '"boolean"'],
    answer: 2,
    explanation: 'In JavaScript, `typeof null` historically evaluates to "object", a known language artifact from the initial 1995 implementation.',
  },

  // 2. Core Conceptual Understanding
  {
    id: 3,
    topic: 'Execution Context',
    area: 'Core Conceptual Understanding',
    question: 'What mechanism allows an inner function to access variables from its enclosing outer scope even after the outer function has finished executing?',
    options: ['Prototypal Inheritance', 'Lexical Closure', 'Event Delegation', 'Memory Buffering'],
    answer: 1,
    explanation: 'A closure is the combination of a function bundled together with references to its lexical environment, allowing it to remember variables from its parent scope.',
  },
  {
    id: 4,
    topic: 'Asynchronous Event Loop',
    area: 'Core Conceptual Understanding',
    question: 'In the JavaScript event loop, which queue has execution priority immediately when the call stack clears?',
    options: ['Macrotask Queue (setTimeout)', 'Microtask Queue (Promises / queueMicrotask)', 'RequestAnimationFrame Queue', 'I/O Polling Queue'],
    answer: 1,
    explanation: 'The microtask queue (Promise callbacks, MutationObserver) is fully drained before the event loop picks the next macrotask.',
  },

  // 3. Theory & Architecture
  {
    id: 5,
    topic: 'React Reconciler',
    area: 'Theory & Architecture',
    question: 'What is the primary architectural purpose of the Virtual DOM and Diffing Algorithm in React?',
    options: [
      'To directly accelerate browser GPU rendering',
      'To compute minimal mutations in memory and batch updates to the real DOM',
      'To eliminate JavaScript memory management',
      'To enforce two-way data binding across all parent-child components',
    ],
    answer: 1,
    explanation: 'The Virtual DOM allows React to compute minimal mutations in memory and reconcile differences before applying batch updates to the real DOM.',
  },
  {
    id: 6,
    topic: 'State Architecture',
    area: 'Theory & Architecture',
    question: 'Why does React require immutable state updates rather than direct in-place mutation?',
    options: [
      'Immutability is strictly required by the JavaScript V8 engine',
      'Predictable shallow equality checks allow React to determine precisely when components need re-rendering',
      'Direct mutation creates security vulnerabilities in browser storage',
      'Mutable state increases memory usage tenfold',
    ],
    answer: 1,
    explanation: 'React compares state references using shallow equality (Object.is). In-place mutations do not change object reference identity, causing missed re-renders.',
  },

  // 4. Syntax & Mechanics
  {
    id: 7,
    topic: 'React Hooks',
    area: 'Syntax & Mechanics',
    question: 'What happens if a state variable used inside a `useEffect` callback is omitted from its dependency array?',
    options: [
      'The effect throws an unhandled syntax exception at compile time',
      'The effect will create a stale closure, reading outdated variable values captured during initial render',
      'React automatically infers and adds the dependency in production builds',
      'The component switches to synchronous rendering mode',
    ],
    answer: 1,
    explanation: 'Omitting a referenced variable from the dependency array locks the effect into a stale closure, causing it to read the variable value captured during its initial render.',
  },
  {
    id: 8,
    topic: 'Functional Programming',
    area: 'Syntax & Mechanics',
    question: 'Which array method transforms an array by applying an accumulator function and returns a single output value without mutating the original array?',
    options: ['splice()', 'reduce()', 'forEach()', 'push()'],
    answer: 1,
    explanation: '`reduce()` executes a reducer callback over all elements, returning a single accumulated result without altering the source array.',
  },

  // 5. Practical Problem-Solving
  {
    id: 9,
    topic: 'Databases & SQL',
    area: 'Practical Problem-Solving',
    question: 'Which SQL clause filters aggregated group records after a `GROUP BY` statement has executed?',
    options: ['WHERE', 'ORDER BY', 'HAVING', 'JOIN'],
    answer: 2,
    explanation: '`WHERE` filters rows before any grouping occurs; `HAVING` filters aggregated records produced by `GROUP BY`.',
  },
  {
    id: 10,
    topic: 'Algorithms & Complexity',
    area: 'Practical Problem-Solving',
    question: 'What is the worst-case time complexity of searching for an element in a sorted array using Binary Search?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    answer: 1,
    explanation: 'Binary Search halves the search space at each iteration, yielding logarithmic time complexity O(log n).',
  },
];

export const roadmapItems = [
  // Milestone 1: Language Mechanics & Core Foundations
  {
    id: 1,
    slug: 'lexical-scope-closures',
    milestone: 'Milestone 1: Core JavaScript Mechanics',
    title: 'Lexical Scope & Advanced Closures',
    topic: 'JavaScript Fundamentals',
    duration: '25 min',
    type: 'Documentation + Code Samples',
    difficulty: 'Intermediate',
    whyThisStep: 'Diagnostic identified closures as a foundational prerequisite for mastering custom React hooks and state encapsulation.',
    hasRevision: false,
    done: true,
  },
  {
    id: 2,
    slug: 'event-loop-microtasks',
    milestone: 'Milestone 1: Core JavaScript Mechanics',
    title: 'Event Loop, Microtasks & Promises',
    topic: 'Asynchronous Architecture',
    duration: '35 min',
    type: 'Interactive Visualizer',
    difficulty: 'Intermediate',
    whyThisStep: 'Critical for avoiding unhandled race conditions and stale closure traps in async data fetching.',
    hasRevision: true,
    done: false,
  },

  // Milestone 2: Modern React Architecture
  {
    id: 3,
    slug: 'react-reconciler-fiber',
    milestone: 'Milestone 2: Component Architecture & State',
    title: 'React 19 Reconciler & Fiber Internals',
    topic: 'React Core',
    duration: '40 min',
    type: 'Deep-Dive Reading',
    difficulty: 'Advanced',
    whyThisStep: 'Teaches when React schedules re-renders and how the new compiler optimizes reconciliation without manual useMemo/useCallback.',
    hasRevision: false,
    done: false,
  },
  {
    id: 4,
    slug: 'custom-hooks-state-machines',
    milestone: 'Milestone 2: Component Architecture & State',
    title: 'Custom Hooks & State Machines',
    topic: 'React Design Patterns',
    duration: '30 min',
    type: 'Hands-on Exercise',
    difficulty: 'Intermediate',
    whyThisStep: 'Ensures business logic is cleanly extracted from presentation components into reusable custom hooks.',
    hasRevision: false,
    done: false,
  },

  // Milestone 3: Data Layer & Persistence
  {
    id: 5,
    slug: 'relational-database-queries',
    milestone: 'Milestone 3: Data Architecture & Storage',
    title: 'Relational Database Queries & Complex Joins',
    topic: 'SQL & Databases',
    duration: '30 min',
    type: 'Practice Sandbox',
    difficulty: 'Intermediate',
    whyThisStep: 'Essential backend data retrieval knowledge required for full-stack feature development and API contract consumption.',
    hasRevision: false,
    done: true,
  },
  {
    id: 6,
    slug: 'indexing-query-optimization',
    milestone: 'Milestone 3: Data Architecture & Storage',
    title: 'Indexing & Query Performance Optimization',
    topic: 'Database Performance',
    duration: '25 min',
    type: 'Video Lesson',
    difficulty: 'Advanced',
    whyThisStep: 'Addresses N+1 query bottlenecks and index scanning patterns before capstone project implementation.',
    hasRevision: false,
    done: false,
  },

  // Milestone 4: Algorithms & Capstone Project
  {
    id: 7,
    slug: 'tree-graph-traversal',
    milestone: 'Milestone 4: Verification & Capstones',
    title: 'Tree & Graph Traversal (DFS/BFS)',
    topic: 'Data Structures',
    duration: '45 min',
    type: 'Coding Problems',
    difficulty: 'Advanced',
    whyThisStep: 'Core problem-solving foundation required for technical interviews and complex graph navigation.',
    hasRevision: false,
    done: false,
  },
  {
    id: 8,
    slug: 'portfolio-capstone-verification',
    milestone: 'Milestone 4: Verification & Capstones',
    title: 'Full-Stack Portfolio Project Verification',
    topic: 'Practical Skill Verification',
    duration: '90 min',
    type: 'GitHub Repository Submission',
    difficulty: 'Advanced',
    whyThisStep: 'Prepares verifiable proof of work for Phase 5 GitHub code review and recruiter certificate issuance.',
    hasRevision: false,
    done: false,
  },
];

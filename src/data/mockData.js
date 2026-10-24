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

export const questions = [
  { topic: 'JavaScript', question: 'Which keyword declares a block-scoped variable that can be reassigned?', options: ['const', 'let', 'static', 'define'], answer: 1 },
  { topic: 'SQL', question: 'Which SQL clause filters rows before grouping?', options: ['ORDER BY', 'HAVING', 'WHERE', 'JOIN'], answer: 2 },
  { topic: 'React', question: 'Which hook is commonly used to manage local component state?', options: ['useState', 'useRoute', 'useStyle', 'useFetchOnly'], answer: 0 },
  { topic: 'Data Structures', question: 'Which data structure follows FIFO order?', options: ['Stack', 'Queue', 'Tree', 'Graph'], answer: 1 },
];

export const roadmapItems = [
  { id: 1, title: 'JavaScript closures', topic: 'JavaScript Fundamentals', duration: '20 min', type: 'Reading + examples', done: true },
  { id: 2, title: 'Practice React Hooks', topic: 'React', duration: '35 min', type: 'Hands-on practice', done: false },
  { id: 3, title: 'Binary trees explained', topic: 'Data Structures', duration: '30 min', type: 'Video lesson', done: false },
  { id: 4, title: 'SQL joins practice', topic: 'SQL & Databases', duration: '25 min', type: 'Practice quiz', done: true },
];

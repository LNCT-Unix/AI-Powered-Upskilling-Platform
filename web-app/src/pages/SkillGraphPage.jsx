import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers3, CheckCircle2, PlayCircle, Lock, ArrowRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const NODES_DATA = [
  {
    id: 'foundations',
    label: 'Programming Foundations',
    tier: 'Tier 1: Prerequisite',
    status: 'mastered',
    pos: 'left-[10%] top-6',
    desc: 'Variables, conditional control flow, functions, memory references.',
    prereqs: 'None (Root Milestone)',
    duration: '20 min',
  },
  {
    id: 'js-mechanics',
    label: 'JavaScript & Closures',
    tier: 'Tier 2: Core Mechanics',
    status: 'mastered',
    pos: 'left-1/2 top-24 -translate-x-1/2',
    desc: 'Lexical scoping, event loop microtasks, prototype chain, async/await.',
    prereqs: 'Programming Foundations',
    duration: '35 min',
  },
  {
    id: 'dsa',
    label: 'Data Structures & Alg',
    tier: 'Tier 3: Problem Solving',
    status: 'in-progress',
    pos: 'left-[8%] top-56',
    desc: 'Trees, hash tables, graph traversals (BFS/DFS), Big-O complexity.',
    prereqs: 'JavaScript & Closures',
    duration: '45 min',
  },
  {
    id: 'react-core',
    label: 'Modern React 19 Architecture',
    tier: 'Tier 3: Component State',
    status: 'in-progress',
    pos: 'right-[8%] top-56',
    desc: 'Fiber reconciler, compiler optimizations, custom hooks, suspense.',
    prereqs: 'JavaScript & Closures',
    duration: '40 min',
  },
  {
    id: 'system-design',
    label: 'Distributed Systems & SQL',
    tier: 'Tier 4: Capstone Ready',
    status: 'locked',
    pos: 'left-1/2 bottom-6 -translate-x-1/2',
    desc: 'Relational indexing, caching layers, microservices, portfolio project verification.',
    prereqs: 'Data Structures + React 19',
    duration: '90 min',
  },
];

export default function SkillGraphPage() {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState(NODES_DATA[1]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo" icon={Layers3}>
              TOPOLOGICAL DEPENDENCIES
            </Badge>
            <span className="text-xs font-medium text-slate-500">Prerequisite Cluster Map</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Interactive Skill Graph
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Click on any skill node to inspect prerequisite requirements and curriculum status.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Mastered
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="h-2 w-2 rounded-full bg-indigo-600" /> Active Frontier
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="h-2 w-2 rounded-full bg-slate-400" /> Locked Prerequisite
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Interactive SVG Graph Canvas (8 cols) */}
        <Card className="lg:col-span-8 p-4 sm:p-6 overflow-hidden">
          <div className="relative mx-auto h-[440px] w-full max-w-2xl select-none">
            {/* SVG Connecting Edges */}
            <svg
              className="absolute inset-0 h-full w-full pointer-events-none"
              viewBox="0 0 600 440"
              preserveAspectRatio="none"
              aria-label="Skill prerequisite connection paths"
            >
              {/* Path 1: Foundations to JS */}
              <path
                d="M160 55 L300 125"
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
              />
              {/* Path 2: JS to DSA */}
              <path
                d="M300 160 L160 250"
                stroke="#818cf8"
                strokeWidth="2.5"
                fill="none"
              />
              {/* Path 3: JS to React */}
              <path
                d="M300 160 L440 250"
                stroke="#818cf8"
                strokeWidth="2.5"
                fill="none"
              />
              {/* Path 4: DSA to System Design */}
              <path
                d="M160 290 L300 380"
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
              />
              {/* Path 5: React to System Design */}
              <path
                d="M440 290 L300 380"
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
              />
            </svg>

            {/* Nodes */}
            {NODES_DATA.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isMastered = node.status === 'mastered';
              const isInProgress = node.status === 'in-progress';

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNode(node)}
                  className={`absolute ${node.pos} z-10 w-40 sm:w-48 rounded-xl border p-3 text-left shadow-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/30 shadow-md'
                      : isMastered
                      ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300'
                      : isInProgress
                      ? 'border-indigo-200 bg-indigo-50/40 hover:border-indigo-300'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                    <span
                      className={
                        isMastered
                          ? 'text-emerald-700'
                          : isInProgress
                          ? 'text-indigo-700'
                          : 'text-slate-400'
                      }
                    >
                      {node.status}
                    </span>
                    {isMastered ? (
                      <CheckCircle2 size={13} className="text-emerald-600" />
                    ) : isInProgress ? (
                      <PlayCircle size={13} className="text-indigo-600" />
                    ) : (
                      <Lock size={13} className="text-slate-400" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                    {node.label}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 truncate">{node.tier}</p>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 text-center mt-3">
            Solid lines represent unlocked frontiers; dashed lines represent dependent prerequisite pathways.
          </p>
        </Card>

        {/* Node Inspection Drawer (4 cols) */}
        <Card className="lg:col-span-4 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Selected Node Inspector
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {selectedNode?.label}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant={
                  selectedNode?.status === 'mastered'
                    ? 'emerald'
                    : selectedNode?.status === 'in-progress'
                    ? 'indigo'
                    : 'neutral'
                }
              >
                {selectedNode?.status?.toUpperCase()}
              </Badge>
              <span className="text-xs text-slate-500 font-medium">
                {selectedNode?.duration}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="font-semibold text-slate-700">Curriculum Scope</p>
              <p className="mt-0.5 text-slate-600 leading-relaxed">{selectedNode?.desc}</p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 space-y-1">
              <p className="font-semibold text-slate-700">Strict Prerequisites</p>
              <p className="text-slate-600">{selectedNode?.prereqs}</p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="indigo"
              size="sm"
              onClick={() => navigate('/roadmap')}
              className="w-full justify-center"
            >
              Open in Roadmap <ArrowRight size={14} />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

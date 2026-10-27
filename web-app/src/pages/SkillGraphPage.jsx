import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { CheckCircle2, Sparkles, Lock, ArrowRight, Layers3 } from 'lucide-react';

const STATUS_CONFIG = {
  MASTERED: { variant: 'emerald', Icon: CheckCircle2, label: 'Mastered',    fill: '#d1fae5', stroke: '#059669', text: '#065f46' },
  FRONTIER: { variant: 'indigo',  Icon: Sparkles,     label: 'In Progress', fill: '#e0e7ff', stroke: '#4f46e5', text: '#3730a3' },
  LOCKED:   { variant: 'neutral', Icon: Lock,         label: 'Up Next',     fill: '#f1f5f9', stroke: '#94a3b8', text: '#475569' },
};

export default function SkillGraphPage() {
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

  const skills = useMemo(() => {
    return assessmentResult?.skills || [];
  }, [assessmentResult]);

  // Compute graph coordinates dynamically
  const { nodes, edges } = useMemo(() => {
    if (skills.length === 0) return { nodes: [], edges: [] };

    // Group skills into rows or clusters
    const clusterMap = {};
    skills.forEach(s => {
      const cluster = s.cluster || 'General';
      if (!clusterMap[cluster]) clusterMap[cluster] = [];
      clusterMap[cluster].push(s);
    });

    const clusters = Object.keys(clusterMap);
    const calculatedNodes = [];
    const calculatedEdges = [];

    clusters.forEach((clusterName, colIdx) => {
      const items = clusterMap[clusterName];
      const colX = clusters.length > 1 ? 15 + (colIdx / (clusters.length - 1)) * 70 : 50;

      items.forEach((item, rowIdx) => {
        const rowY = items.length > 1 ? 18 + (rowIdx / (items.length - 1)) * 64 : 50;
        calculatedNodes.push({
          id: item.skillId || `node-${colIdx}-${rowIdx}`,
          label: item.name,
          cluster: clusterName,
          state: item.state,
          x: colX,
          y: rowY,
        });
      });
    });

    // Create sequential prerequisite edges across columns/rows
    for (let i = 0; i < calculatedNodes.length - 1; i++) {
      calculatedEdges.push({
        from: calculatedNodes[i].id,
        to: calculatedNodes[i + 1].id,
      });
    }

    return { nodes: calculatedNodes, edges: calculatedEdges };
  }, [skills]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Topological Skill Graph</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Prerequisite Dependency Map
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {skills.length > 0
            ? `Calibrated from your diagnostic assessment across ${skills.length} verified competency nodes.`
            : 'Interactive dependency tree mapping your target engineering competencies.'}
        </p>
      </div>

      {skills.length === 0 ? (
        <Card className="text-center py-12 px-6 space-y-4 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <Layers3 size={26} />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-900">No Verified Skill Graph</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Complete your initial diagnostic test to allow the backend adaptive engine to map your verified skills and prerequisite graph.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="indigo" onClick={() => navigate('/assessment')}>
              Take Diagnostic Test <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Legend */}
          <div className="flex flex-wrap gap-4">
            {Object.entries(STATUS_CONFIG).map(([, cfg]) => (
              <div key={cfg.label} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border" style={{ background: cfg.fill, borderColor: cfg.stroke }} />
                <span className="text-xs font-medium text-slate-600">{cfg.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <ArrowRight size={14} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-600">Prerequisite</span>
            </div>
          </div>

          {/* SVG Graph */}
          <Card className="p-0 shadow-sm">
            <div className="p-6">
              <svg
                viewBox="0 0 100 100"
                className="w-full"
                style={{ minWidth: 320, maxHeight: 480 }}
                aria-label="Skill prerequisite graph"
                role="img"
              >
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                  </marker>
                </defs>
                {edges.map((edge) => {
                  const from = nodes.find(n => n.id === edge.from);
                  const to   = nodes.find(n => n.id === edge.to);
                  if (!from || !to) return null;
                  return (
                    <line
                      key={`${edge.from}-${edge.to}`}
                      x1={from.x} y1={from.y + 4}
                      x2={to.x}   y2={to.y - 2}
                      stroke="#cbd5e1" strokeWidth="0.6"
                      markerEnd="url(#arrow)"
                    />
                  );
                })}
                {nodes.map((node) => {
                  const cfg = STATUS_CONFIG[node.state] || STATUS_CONFIG.LOCKED;
                  return (
                    <g key={node.id}>
                      <rect
                        x={node.x - 12}
                        y={node.y - 4}
                        width={24}
                        height={8}
                        rx={4}
                        fill={cfg.fill}
                        stroke={cfg.stroke}
                        strokeWidth="0.5"
                      />
                      <text
                        x={node.x}
                        y={node.y + 1.2}
                        textAnchor="middle"
                        fontSize="2.2"
                        fill={cfg.text}
                        fontWeight="600"
                        fontFamily="Inter, sans-serif"
                      >
                        {node.label.length > 16 ? `${node.label.slice(0, 15)}…` : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </Card>

          {/* Accessible table */}
          <Card className="space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Verified Competencies — Detailed Breakdown
            </h2>
            <table className="w-full text-xs border-collapse" aria-label="Skill nodes">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Skill</th>
                  <th className="text-left py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Cluster</th>
                  <th className="text-left py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {skills.map((skill) => {
                  const cfg = STATUS_CONFIG[skill.state] || STATUS_CONFIG.LOCKED;
                  return (
                    <tr key={skill.skillId || skill.name} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-semibold text-slate-800">{skill.name}</td>
                      <td className="py-2.5 text-slate-500">{skill.cluster || 'General'}</td>
                      <td className="py-2.5">
                        <Badge variant={cfg.variant}>
                          <cfg.Icon size={10} /> {cfg.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

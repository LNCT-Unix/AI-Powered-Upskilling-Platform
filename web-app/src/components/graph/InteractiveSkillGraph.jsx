import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildGraphModel, computeLayout, clusterTitle, clusterHue } from './graphModel';
import '../../pages/SkillGraphPage.css';

/* ================= Inline SVG Icons matching the prototype ================= */
const ICONS = {
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  database: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  sigma: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 7V4H6l6 8-6 8h12v-3" />
    </svg>
  ),
  terminal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  git: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  share: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  cpu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  ),
  shapes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <circle cx="17.5" cy="17.5" r="3.5" />
    </svg>
  ),
  network: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
      <path d="M12 12V8" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
};

export default function InteractiveSkillGraph({ skills = [], height = 480, showHeader = false, initialCluster = null }) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const userSelectedClusterRef = useRef(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // Pan & Zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const stageRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Build the graph model, then lay out the cluster sub-graphs (islands)
  const graph = useMemo(() => buildGraphModel(skills), [skills]);

  // Extract available cluster modules (matches the top-left title of island cards)
  const clusterOptions = useMemo(() => {
    const map = new Map();
    graph.nodes.forEach((n) => {
      const c = n.cluster || 'core';
      if (!map.has(c)) {
        map.set(c, {
          key: c,
          title: clusterTitle(c),
          count: 0,
        });
      }
      map.get(c).count++;
    });
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [graph.nodes]);

  // Default to an individual block to prevent initial render lag & slowness:
  // Prioritize block with active frontier skills, otherwise first cluster in graph
  const defaultCluster = useMemo(() => {
    if (initialCluster) return initialCluster;
    if (graph.nodes.length === 0) return 'all';
    const frontierNode = graph.nodes.find((n) => n.status === 'frontier');
    if (frontierNode?.cluster) return frontierNode.cluster;
    return clusterOptions[0]?.key || graph.nodes[0]?.cluster || 'all';
  }, [initialCluster, graph.nodes, clusterOptions]);

  const [selectedCluster, setSelectedCluster] = useState(() => defaultCluster);

  // When skills or defaultCluster resolve, update initial cluster if user hasn't manually selected one
  useEffect(() => {
    if (!userSelectedClusterRef.current && defaultCluster && defaultCluster !== 'all') {
      setSelectedCluster(defaultCluster);
    }
  }, [defaultCluster]);

  const layout = useMemo(() => computeLayout(graph, selectedCluster), [graph, selectedCluster]);

  const handleClusterChange = useCallback((newCluster) => {
    userSelectedClusterRef.current = true;
    setSelectedCluster(newCluster);
    setIsDropdownOpen(false);
    if (selectedNodeId && newCluster !== 'all') {
      const node = graph.nodes.find((n) => n.id === selectedNodeId);
      if (node && node.cluster !== newCluster) {
        setSelectedNodeId(null);
      }
    }
  }, [selectedNodeId, graph.nodes]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Counts for status filters
  const counts = useMemo(() => {
    const res = { mastered: 0, frontier: 0, locked: 0 };
    layout.nodesList.forEach((n) => {
      if (res[n.status] !== undefined) res[n.status]++;
    });
    return res;
  }, [layout]);

  // Fit to view
  const fitView = useCallback(() => {
    if (!stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const padding = 70;
    const scaleX = (r.width - padding) / layout.worldW;
    const scaleY = (r.height - padding) / layout.worldH;
    const clampedScale = Math.min(1.2, Math.max(0.12, Math.min(scaleX, scaleY)));
    const vx = (r.width - layout.worldW * clampedScale) / 2;
    const vy = (r.height - layout.worldH * clampedScale) / 2;
    setTransform({ x: vx, y: vy, scale: clampedScale });
  }, [layout.worldW, layout.worldH]);

  useEffect(() => {
    const timer = setTimeout(fitView, 60);
    window.addEventListener('resize', fitView);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', fitView);
    };
  }, [fitView]);

  // Auto re-center whenever selected cluster changes
  useEffect(() => {
    const timer = setTimeout(fitView, 50);
    return () => clearTimeout(timer);
  }, [selectedCluster, fitView]);

  // Zoom towards a specific point
  const zoomAt = useCallback((cx, cy, factor) => {
    setTransform((prev) => {
      const nextScale = Math.min(2.4, Math.max(0.12, prev.scale * factor));
      const nx = cx - (cx - prev.x) * (nextScale / prev.scale);
      const ny = cy - (cy - prev.y) * (nextScale / prev.scale);
      return { x: nx, y: ny, scale: nextScale };
    });
  }, []);

  // Pointer drag panning
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.sg-panel') || e.target.closest('.sg-zoomctl') || e.target.closest('.sg-cluster-dropdown-wrapper')) return;
    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    stageRef.current?.classList.add('panning');
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) {
      isDraggingRef.current = true;
    }
    if (isDraggingRef.current) {
      setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    stageRef.current?.classList.remove('panning');

    if (!isDraggingRef.current && !e.target.closest('.sg-node') && !e.target.closest('.sg-panel')) {
      setSelectedNodeId(null);
    }
  };

  // Wheel zoom
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomAt(cx, cy, factor);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const selectedNode = selectedNodeId ? (layout.byId.get(selectedNodeId) || layout.fullById?.get(selectedNodeId)) : null;
  const childrenOf = (id) => layout.fullChildren?.get(id) || layout.children.get(id) || [];
  const parentsOf = (id) => layout.fullParents?.get(id) || layout.parents.get(id) || [];

  const activeClusterTitle = selectedCluster !== 'all' ? clusterTitle(selectedCluster) : null;
  const subtitle = selectedCluster !== 'all'
    ? `Viewing ${activeClusterTitle} \u00b7 ${layout.nodesList.length} skills \u00b7 ${layout.islands[0]?.localMax ? layout.islands[0].localMax + 1 : 1} layers`
    : (graph.isLive
      ? `${graph.clusterCount} cluster sub-graphs \u00b7 ${graph.edgeCount} prerequisite links \u00b7 longest path ${graph.maxLayer + 1} levels`
      : 'Preview dataset \u2014 take the diagnostic to map your own graph');

  return (
    <div className="sg-component-root flex flex-col gap-3 w-full" style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}>
      {showHeader && (
        <header className="sg-topbar">
          <div className="sg-brand">
            <div className="sg-brand-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="21.17" y1="8" x2="12" y2="8" />
                <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
              </svg>
            </div>
            <div>
              <h1>Interactive Skill Graph</h1>
              <p>{subtitle}</p>
            </div>
          </div>

          <div className="sg-legend">
            <div className="sg-chip">
              <span className="sg-dot" style={{ background: 'var(--sg-mastered)' }} />
              Mastered &nbsp;<b>{counts.mastered}</b>
            </div>
            <div className="sg-chip">
              <span className="sg-dot" style={{ background: 'var(--sg-frontier)' }} />
              Frontier &nbsp;<b>{counts.frontier}</b>
            </div>
            <div className="sg-chip">
              <span className="sg-dot" style={{ background: 'var(--sg-locked)' }} />
              Locked &nbsp;<b>{counts.locked}</b>
            </div>
          </div>
        </header>
      )}

      {/* Toolbar */}
      <div className="sg-toolbar">
        <div className="sg-toolbar-controls">
          {/* Module / Block Dropdown */}
          <div className="sg-cluster-dropdown-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className={`sg-cluster-dropdown-btn ${isDropdownOpen ? 'open' : ''}`}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              title="Filter by skill block or show all"
            >
              {selectedCluster === 'all' ? (
                <>
                  <span className="sg-cluster-all-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                  </span>
                  <span className="sg-cluster-btn-text">Show All Blocks</span>
                  <span className="sg-cluster-count-pill">{graph.nodes.length}</span>
                </>
              ) : (
                <>
                  <span
                    className="sg-cluster-dot"
                    style={{ background: `hsl(${clusterHue(selectedCluster)} 62% 55%)` }}
                  />
                  <span className="sg-cluster-btn-text">{clusterTitle(selectedCluster)}</span>
                  <span className="sg-cluster-count-pill">
                    {clusterOptions.find((c) => c.key === selectedCluster)?.count || layout.nodesList.length}
                  </span>
                </>
              )}
              <svg className="sg-dropdown-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="sg-cluster-menu" role="listbox">
                <div className="sg-cluster-menu-header">Graph View Options</div>

                {/* Show All Together Option */}
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedCluster === 'all'}
                  className={`sg-cluster-menu-item ${selectedCluster === 'all' ? 'selected' : ''}`}
                  onClick={() => handleClusterChange('all')}
                >
                  <div className="sg-cluster-item-left">
                    <span className="sg-cluster-all-icon-sm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                    </span>
                    <div className="sg-cluster-item-titles">
                      <span className="sg-cluster-item-name">Show all together</span>
                      <span className="sg-cluster-item-sub">All blocks &amp; cross-prerequisite links</span>
                    </div>
                  </div>
                  <div className="sg-cluster-item-right">
                    <span className="sg-cluster-count-pill">{graph.nodes.length}</span>
                    {selectedCluster === 'all' && (
                      <span className="sg-cluster-check">&#10003;</span>
                    )}
                  </div>
                </button>

                <div className="sg-cluster-menu-divider" />
                <div className="sg-cluster-menu-header">Individual Blocks ({clusterOptions.length})</div>

                {/* Individual Cluster Blocks */}
                {clusterOptions.map((c) => {
                  const isSelected = selectedCluster === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`sg-cluster-menu-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleClusterChange(c.key)}
                    >
                      <div className="sg-cluster-item-left">
                        <span
                          className="sg-cluster-dot"
                          style={{ background: `hsl(${clusterHue(c.key)} 62% 55%)` }}
                        />
                        <span className="sg-cluster-item-name">{c.title}</span>
                      </div>
                      <div className="sg-cluster-item-right">
                        <span className="sg-cluster-count-pill">{c.count}</span>
                        {isSelected && (
                          <span className="sg-cluster-check">&#10003;</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="sg-filters">
            {[
              ['all', 'All', layout.nodesList.length],
              ['mastered', 'Mastered', counts.mastered],
              ['frontier', 'Frontier', counts.frontier],
              ['locked', 'Locked', counts.locked],
            ].map(([key, label, count]) => (
              <button
                key={key}
                className={activeFilter === key ? 'active' : ''}
                onClick={() => setActiveFilter(key)}
              >
                {label} <b>{count}</b>
              </button>
            ))}
          </div>
        </div>

        <div className="sg-hint">
          Drag to pan &nbsp;·&nbsp; Scroll to zoom &nbsp;·&nbsp; <kbd>Click</kbd> a node for details
        </div>
      </div>

      {/* Stage */}
      <div
        className="sg-stage"
        ref={stageRef}
        data-filter={activeFilter}
        style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="sg-world"
          style={{
            width: layout.worldW,
            height: layout.worldH,
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          {/* Cluster island cards */}
          {layout.islands.map((island, idx) => (
            <div
              key={island.cluster}
              className="sg-island"
              style={{ left: island.x, top: island.y, width: island.width, height: island.height, animationDelay: `${idx * 55}ms` }}
            >
              <div className="sg-i-head">
                <span className="sg-i-title">
                  <span
                    className="sg-i-dot"
                    style={{ background: `hsl(${clusterHue(island.cluster)} 62% 55%)` }}
                  />
                  {clusterTitle(island.cluster)}
                </span>
                <div className="sg-i-head-actions">
                  <span className="sg-i-meta">
                    {island.islandNodes.length} skills
                    {island.localMax > 0 ? ` \u00b7 ${island.localMax + 1} layers` : ''}
                  </span>
                  {selectedCluster === 'all' ? (
                    <button
                      type="button"
                      className="sg-i-focus-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClusterChange(island.cluster);
                      }}
                      title={`Focus on ${clusterTitle(island.cluster)} block`}
                    >
                      Focus
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="sg-i-focus-btn active"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClusterChange('all');
                      }}
                      title="Show all blocks together"
                    >
                      Show all
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Edges SVG */}
          <svg
            id="sg-edges-svg"
            width={layout.worldW}
            height={layout.worldH}
            viewBox={`0 0 ${layout.worldW} ${layout.worldH}`}
          >
            <defs>
              {['mastered', 'frontier', 'locked'].map((status) => (
                <marker
                  key={status}
                  id={`sg-arrow-${status}`}
                  viewBox="0 0 10 10"
                  refX="8.6"
                  refY="5"
                  markerWidth="7.5"
                  markerHeight="7.5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 2 9 z" className={`sg-arrow-fill-${status}`} />
                </marker>
              ))}
            </defs>
            {layout.edgePaths.map((edge) => {
              const isHot =
                (hoveredNodeId && (edge.from === hoveredNodeId || edge.to === hoveredNodeId)) ||
                (selectedNodeId && (edge.from === selectedNodeId || edge.to === selectedNodeId));
              const isDim = (hoveredNodeId || selectedNodeId) && !isHot;

              return (
                <path
                  key={`${edge.from}->${edge.to}`}
                  d={edge.d}
                  className={`sg-edge to-${edge.status} ${edge.cross ? 'cross' : ''} ${isHot ? 'hot' : ''} ${isDim ? 'dim' : ''}`}
                  style={{ animationDelay: `${140 + edge.layer * 110}ms` }}
                  markerEnd={`url(#sg-arrow-${edge.status})`}
                />
              );
            })}
          </svg>

          {/* Nodes Container */}
          <div id="sg-nodes-container">
            {layout.nodesList.map((n, i) => {
              const stateIcon = n.status === 'mastered' ? 'check' : n.status === 'frontier' ? 'flame' : 'lock';
              const isSelected = selectedNodeId === n.id;
              const isConnected =
                hoveredNodeId &&
                (hoveredNodeId === n.id ||
                  childrenOf(hoveredNodeId).includes(n.id) ||
                  parentsOf(hoveredNodeId).includes(n.id));
              const isDim = hoveredNodeId && !isConnected;

              const parentSkills = parentsOf(n.id);
              let subText = '';
              if (n.status === 'mastered') {
                subText = 'Completed';
              } else if (n.status === 'frontier') {
                subText = `${n.progress || 50}% complete`;
              } else {
                const parentNode = layout.byId.get(parentSkills[0]) || layout.fullById?.get(parentSkills[0]);
                subText = parentSkills.length > 0
                  ? `Needs ${parentNode?.label || 'Parent'}${parentSkills.length > 1 ? ` +${parentSkills.length - 1}` : ''}`
                  : 'Root Skill';
              }

              return (
                <div
                  key={n.id}
                  className={`sg-node ${n.status} ${isSelected ? 'active' : ''} ${isDim ? 'dim' : ''}`}
                  style={{
                    left: `${n.x}px`,
                    top: `${n.y}px`,
                    animationDelay: `${Math.min((n.layer || 0) * 110, 700) + (i % 5) * 70}ms`,
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={n.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId((prev) => (prev === n.id ? null : n.id));
                  }}
                  onMouseEnter={() => setHoveredNodeId(n.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedNodeId(n.id);
                    }
                  }}
                >
                  <div className="sg-n-icon">{ICONS[n.icon] || ICONS.box}</div>
                  <div className="sg-n-text">
                    <div className="sg-n-label">{n.label}</div>
                    <div className="sg-n-sub">{subText}</div>
                  </div>
                  <div className="sg-n-state">{ICONS[stateIcon]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="sg-zoomctl">
          {selectedCluster !== 'all' && (
            <button
              type="button"
              className="sg-zoom-reset-block"
              onClick={() => handleClusterChange('all')}
              title="Show all blocks together"
              aria-label="Show all blocks"
            >
              <span
                className="sg-zoom-reset-dot"
                style={{ background: `hsl(${clusterHue(selectedCluster)} 62% 55%)` }}
              />
              <span className="sg-zoom-reset-text">{clusterTitle(selectedCluster)}</span>
              <span className="sg-zoom-reset-x">&#10005;</span>
            </button>
          )}
          <button
            onClick={() => {
              if (!stageRef.current) return;
              const r = stageRef.current.getBoundingClientRect();
              zoomAt(r.width / 2, r.height / 2, 1.25);
            }}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => {
              if (!stageRef.current) return;
              const r = stageRef.current.getBoundingClientRect();
              zoomAt(r.width / 2, r.height / 2, 0.8);
            }}
            aria-label="Zoom out"
          >
            &minus;
          </button>
          <button onClick={fitView} aria-label="Fit to view" title="Fit to view">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>
          <span className="sg-zlabel">{Math.round(transform.scale * 100)}%</span>
        </div>

        {/* Detail Panel */}
        <aside className={`sg-panel ${selectedNode ? 'open' : ''}`}>
          {selectedNode && (
            <>
              <button
                className="sg-panel-close"
                onClick={() => setSelectedNodeId(null)}
                aria-label="Close"
              >
                &#10005;
              </button>
              <div className={`sg-p-badge ${selectedNode.status}`}>
                {ICONS[selectedNode.status === 'mastered' ? 'check' : selectedNode.status === 'frontier' ? 'flame' : 'lock']}
                <span>
                  {selectedNode.status === 'mastered'
                    ? 'Mastered'
                    : selectedNode.status === 'frontier'
                    ? 'Frontier — in progress'
                    : 'Locked'}
                </span>
              </div>
              <h2>{selectedNode.label}</h2>
              <p className="sg-p-cluster">{clusterTitle(selectedNode.cluster)} cluster</p>
              <p className="sg-desc">{selectedNode.desc}</p>

              {selectedNode.status === 'frontier' && (
                <div className="sg-prog-wrap">
                  <div className="sg-prog-label">
                    <span>Progress</span>
                    <span>{selectedNode.progress || 50}%</span>
                  </div>
                  <div className="sg-progress">
                    <i style={{ width: `${selectedNode.progress || 50}%` }} />
                  </div>
                </div>
              )}

              <div className="sg-rel">
                <h4>Requires</h4>
                <div className="sg-chips">
                  {parentsOf(selectedNode.id).length > 0 ? (
                    parentsOf(selectedNode.id).map((parentId) => {
                      const p = layout.byId.get(parentId) || layout.fullById?.get(parentId);
                      const isCrossCluster = p && selectedCluster !== 'all' && p.cluster !== selectedCluster;
                      return (
                        <button
                          key={parentId}
                          onClick={() => {
                            if (p && selectedCluster !== 'all' && p.cluster !== selectedCluster) {
                              handleClusterChange(p.cluster);
                            }
                            setSelectedNodeId(parentId);
                          }}
                          title={p ? `${p.label} (${clusterTitle(p.cluster)})` : parentId}
                        >
                          {p?.label || parentId}
                          {isCrossCluster && (
                            <span className="sg-other-cluster-badge">
                              &nbsp;&bull; {clusterTitle(p.cluster)}
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <span className="sg-none">No prerequisites — root skill</span>
                  )}
                </div>
              </div>

              <div className="sg-rel">
                <h4>Unlocks</h4>
                <div className="sg-chips">
                  {childrenOf(selectedNode.id).length > 0 ? (
                    childrenOf(selectedNode.id).map((childId) => {
                      const c = layout.byId.get(childId) || layout.fullById?.get(childId);
                      const isCrossCluster = c && selectedCluster !== 'all' && c.cluster !== selectedCluster;
                      return (
                        <button
                          key={childId}
                          onClick={() => {
                            if (c && selectedCluster !== 'all' && c.cluster !== selectedCluster) {
                              handleClusterChange(c.cluster);
                            }
                            setSelectedNodeId(childId);
                          }}
                          title={c ? `${c.label} (${clusterTitle(c.cluster)})` : childId}
                        >
                          {c?.label || childId}
                          {isCrossCluster && (
                            <span className="sg-other-cluster-badge">
                              &nbsp;&bull; {clusterTitle(c.cluster)}
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <span className="sg-none">Terminal skill for now</span>
                  )}
                </div>
              </div>

              <button
                className={`sg-p-cta ${selectedNode.status}`}
                onClick={() => {
                  if (selectedNode.status === 'frontier') {
                    navigate('/roadmap');
                  } else if (selectedNode.status === 'locked') {
                    navigate('/assessment');
                  } else {
                    navigate('/roadmap');
                  }
                }}
              >
                {selectedNode.status === 'mastered'
                  ? 'Review notes'
                  : selectedNode.status === 'frontier'
                  ? 'Continue learning'
                  : 'Unlock path'}
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

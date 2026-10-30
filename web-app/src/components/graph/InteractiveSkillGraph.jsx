import { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildGraphModel, computeLayout, clusterTitle, clusterHue, toSkillSlug } from './graphModel';
import SkillQuizModal from './SkillQuizModal';
import '../../pages/SkillGraphPage.css';

/* ================= Inline SVG Icons matching the prototype ================= */
// Defined outside the component so they are created once, not on every render.
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

/* ===============================================================
   SkillNode — memoized so it only re-renders when its own props
   change, not when any other node is hovered / selected.
   =============================================================== */
const SkillNode = memo(function SkillNode({ n, isSelected, isDim, isJustUnlocked, subText, onClick, onMouseEnter, onMouseLeave, onKeyDown, animDelay }) {
  const isUnlocked = n.status === 'unlocked' || n.status === 'mastered';
  const stateIcon = isUnlocked ? 'check' : 'lock';
  const statusClass = isUnlocked ? 'unlocked' : 'locked';
  return (
    <div
      className={`sg-node ${statusClass}${isSelected ? ' active' : ''}${isDim ? ' dim' : ''}${isJustUnlocked ? ' just-unlocked' : ''}`}
      style={{ left: `${n.x}px`, top: `${n.y}px`, animationDelay: animDelay }}
      tabIndex={0}
      role="button"
      aria-label={n.label}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={onKeyDown}
    >
      <div className="sg-n-icon">{ICONS[n.icon] || ICONS.box}</div>
      <div className="sg-n-text">
        <div className="sg-n-label">{n.label}</div>
        <div className="sg-n-sub">{subText}</div>
      </div>
      <div className="sg-n-state">{ICONS[stateIcon]}</div>
    </div>
  );
});

export default function InteractiveSkillGraph({ skills = [], height = 480, showHeader = false, initialCluster = null, onSkillUnlocked = null }) {
  const [liveSkills, setLiveSkills] = useState(skills);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizNode, setQuizNode] = useState(null);
  const [recentlyUnlockedId, setRecentlyUnlockedId] = useState(null);

  useEffect(() => {
    setLiveSkills(skills);
  }, [skills]);
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const userSelectedClusterRef = useRef(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // ── Pan & Zoom ──────────────────────────────────────────────────────────────
  // Store transform in a ref and drive the DOM directly — never calls setState
  // during drag/wheel so the whole tree is NOT re-rendered on every pixel moved.
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const [zoomLabel, setZoomLabel] = useState(100); // only re-renders the % badge
  const stageRef = useRef(null);
  const worldRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  // Apply transform directly to the world DOM node — bypasses React reconciler
  const applyTransform = useCallback((t) => {
    if (worldRef.current) {
      worldRef.current.style.transform = `translate(${t.x}px,${t.y}px) scale(${t.scale})`;
    }
  }, []);

  // Debounce the zoom-% label update to a single rAF tick
  const scheduleZoomLabel = useCallback((scale) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setZoomLabel(Math.round(scale * 100)));
  }, []);

  // Build the graph model, then lay out the cluster sub-graphs (islands)
  const graph = useMemo(() => buildGraphModel(liveSkills), [liveSkills]);

  // Extract available cluster modules
  const clusterOptions = useMemo(() => {
    const map = new Map();
    graph.nodes.forEach((n) => {
      const c = n.cluster || 'core';
      if (!map.has(c)) map.set(c, { key: c, title: clusterTitle(c), count: 0 });
      map.get(c).count++;
    });
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [graph.nodes]);

  // Default checked blocks: select only 1 individual block by default
  const defaultSelectedClusters = useMemo(() => {
    if (clusterOptions.length === 0) return [];
    const activeNode = graph.nodes.find((n) => n.status === 'unlocked');
    const preferredCluster = initialCluster || activeNode?.cluster;
    if (preferredCluster && clusterOptions.some((c) => c.key === preferredCluster)) {
      return [preferredCluster];
    }
    return [clusterOptions[0].key];
  }, [clusterOptions, initialCluster, graph.nodes]);

  const [selectedClusters, setSelectedClusters] = useState(() => defaultSelectedClusters);

  useEffect(() => {
    if (!userSelectedClusterRef.current && defaultSelectedClusters.length > 0) {
      setSelectedClusters(defaultSelectedClusters);
    }
  }, [defaultSelectedClusters]);

  const layout = useMemo(() => computeLayout(graph, selectedClusters), [graph, selectedClusters]);

  const handleToggleCluster = useCallback((clusterKey) => {
    userSelectedClusterRef.current = true;
    setSelectedClusters((prev) => {
      const isChecked = prev.includes(clusterKey);
      return isChecked ? prev.filter((k) => k !== clusterKey) : [...prev, clusterKey];
    });
  }, []);

  const handleQuizSuccess = useCallback((quizResult) => {
    const unlockedSlug = quizResult?.skillSlug || quizNode?.slug || quizNode?.id;
    if (!unlockedSlug) return;

    // 1. Update localStorage
    try {
      const raw = localStorage.getItem('skillpath_assessment_result');
      if (raw) {
        const parsed = JSON.parse(raw);
        const skillList = Array.isArray(parsed) ? parsed : (parsed.skills || []);
        const updatedList = skillList.map((s) => {
          const sSlug = s.slug || toSkillSlug(s.name);
          if (sSlug === unlockedSlug || s.id === unlockedSlug || s.skillId === unlockedSlug) {
            return { ...s, state: 'READY_TO_LEARN', status: 'unlocked' };
          }
          return s;
        });

        if (Array.isArray(parsed)) {
          localStorage.setItem('skillpath_assessment_result', JSON.stringify(updatedList));
        } else {
          parsed.skills = updatedList;
          if (Array.isArray(parsed.unlockedSkills)) {
            const alreadyInUnlocked = parsed.unlockedSkills.some(
              (u) => (u.slug || toSkillSlug(u.name)) === unlockedSlug
            );
            if (!alreadyInUnlocked) {
              const newlyUnlocked = updatedList.find(
                (s) => (s.slug || toSkillSlug(s.name)) === unlockedSlug
              );
              if (newlyUnlocked) parsed.unlockedSkills.push(newlyUnlocked);
            }
          }
          localStorage.setItem('skillpath_assessment_result', JSON.stringify(parsed));
        }
      }
    } catch (err) {
      console.warn('Failed to update localStorage assessment result', err);
    }

    // 2. Update local state so graph reacts immediately
    setLiveSkills((prev) =>
      prev.map((s) => {
        const sSlug = s.slug || toSkillSlug(s.name);
        if (sSlug === unlockedSlug || s.id === unlockedSlug || s.skillId === unlockedSlug) {
          return { ...s, state: 'READY_TO_LEARN', status: 'unlocked' };
        }
        return s;
      })
    );

    // 3. Trigger visual celebratory pulse on the canvas node
    setRecentlyUnlockedId(unlockedSlug);
    setTimeout(() => {
      setRecentlyUnlockedId(null);
    }, 2500);

    // 4. Notify parent callback if provided
    if (onSkillUnlocked) {
      onSkillUnlocked(unlockedSlug, quizResult);
    }
  }, [quizNode, onSkillUnlocked]);

  const handleEnsureClusterVisible = useCallback((clusterKey) => {
    userSelectedClusterRef.current = true;
    setSelectedClusters((prev) => (prev.includes(clusterKey) ? prev : [...prev, clusterKey]));
  }, []);

  // Deselect node if its parent block gets unchecked
  useEffect(() => {
    if (selectedNodeId) {
      const node = graph.nodes.find((n) => n.id === selectedNodeId);
      if (node && !selectedClusters.includes(node.cluster)) {
        setSelectedNodeId(null);
      }
    }
  }, [selectedClusters, selectedNodeId, graph.nodes]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Counts for status filters
  const counts = useMemo(() => {
    const res = { unlocked: 0, locked: 0 };
    layout.nodesList.forEach((n) => {
      const isReady = n.status === 'unlocked' || n.status === 'mastered';
      if (isReady) res.unlocked += 1;
      else res.locked += 1;
    });
    return res;
  }, [layout]);

  // ── Fit-to-view ─────────────────────────────────────────────────────────────
  const fitView = useCallback(() => {
    if (!stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const padding = 70;
    const s = Math.min(1.2, Math.max(0.12, Math.min(
      (r.width - padding) / layout.worldW,
      (r.height - padding) / layout.worldH,
    )));
    const t = {
      x: (r.width - layout.worldW * s) / 2,
      y: (r.height - layout.worldH * s) / 2,
      scale: s,
    };
    transformRef.current = t;
    applyTransform(t);
    scheduleZoomLabel(s);
  }, [layout.worldW, layout.worldH, applyTransform, scheduleZoomLabel]);

  useEffect(() => {
    const timer = setTimeout(fitView, 60);
    window.addEventListener('resize', fitView);
    return () => { clearTimeout(timer); window.removeEventListener('resize', fitView); };
  }, [fitView]);

  // Re-center on cluster selection change
  useEffect(() => {
    const timer = setTimeout(fitView, 50);
    return () => clearTimeout(timer);
  }, [selectedClusters, fitView]);

  // ── Zoom ─────────────────────────────────────────────────────────────────────
  const zoomAt = useCallback((cx, cy, factor) => {
    const prev = transformRef.current;
    const nextScale = Math.min(2.4, Math.max(0.12, prev.scale * factor));
    const t = {
      x: cx - (cx - prev.x) * (nextScale / prev.scale),
      y: cy - (cy - prev.y) * (nextScale / prev.scale),
      scale: nextScale,
    };
    transformRef.current = t;
    applyTransform(t);
    scheduleZoomLabel(nextScale);
  }, [applyTransform, scheduleZoomLabel]);

  // ── Pointer drag panning ─────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (
      e.target.closest('.sg-panel') ||
      e.target.closest('.sg-zoomctl') ||
      e.target.closest('.sg-cluster-dropdown-wrapper')
    ) return;
    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    stageRef.current?.classList.add('panning');
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isPointerDownRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) isDraggingRef.current = true;
    if (isDraggingRef.current) {
      const prev = transformRef.current;
      const t = { ...prev, x: prev.x + dx, y: prev.y + dy };
      transformRef.current = t;
      applyTransform(t);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [applyTransform]);

  const handlePointerUp = useCallback((e) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    stageRef.current?.classList.remove('panning');
    if (!isDraggingRef.current && !e.target.closest('.sg-node') && !e.target.closest('.sg-panel')) {
      setSelectedNodeId(null);
    }
  }, []);

  // Wheel zoom
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // Touch pinch-to-zoom for mobile screens
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    let initialDist = null;
    let initialScale = 1;

    const getDistance = (t1, t2) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        initialDist = getDistance(e.touches[0], e.touches[1]);
        initialScale = transformRef.current.scale;
        isPointerDownRef.current = false;
        stageRef.current?.classList.remove('panning');
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && initialDist) {
        e.preventDefault();
        const currentDist = getDistance(e.touches[0], e.touches[1]);
        if (currentDist > 0) {
          const rect = el.getBoundingClientRect();
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
          const factor = currentDist / initialDist;

          const prev = transformRef.current;
          const targetScale = Math.min(2.4, Math.max(0.12, initialScale * factor));
          const t = {
            x: midX - (midX - prev.x) * (targetScale / prev.scale),
            y: midY - (midY - prev.y) * (targetScale / prev.scale),
            scale: targetScale,
          };
          transformRef.current = t;
          applyTransform(t);
          scheduleZoomLabel(targetScale);
        }
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) {
        initialDist = null;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [applyTransform, scheduleZoomLabel]);

  // ── Derived helpers ──────────────────────────────────────────────────────────
  const selectedNode = selectedNodeId
    ? (layout.byId.get(selectedNodeId) || layout.fullById?.get(selectedNodeId))
    : null;

  const childrenOf = useCallback(
    (id) => layout.fullChildren?.get(id) || layout.children.get(id) || [],
    [layout],
  );
  const parentsOf = useCallback(
    (id) => layout.fullParents?.get(id) || layout.parents.get(id) || [],
    [layout],
  );

  // ── Stable node interaction handlers (won't invalidate SkillNode memo) ───────
  const handleNodeClick = useCallback((id) => setSelectedNodeId((prev) => (prev === id ? null : id)), []);
  const handleNodeMouseEnter = useCallback((id) => setHoveredNodeId(id), []);
  const handleNodeMouseLeave = useCallback(() => setHoveredNodeId(null), []);
  const handleNodeKeyDown = useCallback((e, id) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedNodeId(id); }
  }, []);

  if (graph.nodes.length === 0) {
    return (
      <div
        className="sg-component-root flex items-center justify-center w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center"
        style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="max-w-md space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-[#EFEAFC] border border-[#7C5CFA]/20 flex items-center justify-center mx-auto text-[#7C5CFA]">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900">No Assessment Data Available</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Take the adaptive diagnostic test to calibrate your ability level and generate your skill dependency graph.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => navigate('/assessment')}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#7C5CFA] px-4 py-2 text-xs font-bold text-white hover:bg-[#6244E8] transition cursor-pointer shadow-sm"
            >
              Take Diagnostic Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subtitle = selectedClusters.length > 0
    ? `Showing ${selectedClusters.length} block${selectedClusters.length > 1 ? 's' : ''} · ${layout.nodesList.length} skills · ${layout.edgePaths.length} prerequisite links`
    : 'No blocks selected — check blocks from the dropdown to view skills';

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
              title="Filter visible skill blocks"
            >
              <span className="sg-cluster-blocks-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </span>
              <span className="sg-cluster-btn-text">
                {selectedClusters.length === 0
                  ? 'No Blocks Selected'
                  : selectedClusters.length === 1
                  ? clusterTitle(selectedClusters[0])
                  : `${selectedClusters.length} Blocks Visible`}
              </span>
              <span className="sg-cluster-count-pill">
                {selectedClusters.length} / {clusterOptions.length}
              </span>
              <svg className="sg-dropdown-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="sg-cluster-menu" role="listbox">
                <div className="sg-cluster-menu-header">
                  <span>Individual Blocks ({selectedClusters.length}/{clusterOptions.length} visible)</span>
                </div>

                {/* Individual Cluster Blocks with Checkboxes */}
                {clusterOptions.map((c) => {
                  const isChecked = selectedClusters.includes(c.key);
                  return (
                    <label
                      key={c.key}
                      className={`sg-cluster-menu-item sg-cluster-checkbox-row ${isChecked ? 'selected' : ''}`}
                      onClick={(e) => {
                        // Prevent synthetic double-fire when clicking the label
                        if (e.target.tagName !== 'INPUT') {
                          e.preventDefault();
                          handleToggleCluster(c.key);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        className="sg-cluster-checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCluster(c.key)}
                      />
                      <div className="sg-cluster-item-left">
                        <span className="sg-cluster-dot" style={{ background: `hsl(${clusterHue(c.key)} 62% 55%)` }} />
                        <span className="sg-cluster-item-name">{c.title}</span>
                      </div>
                      <div className="sg-cluster-item-right">
                        <span className="sg-cluster-count-pill">{c.count}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="sg-filters">
            {[
              ['all', 'All', layout.nodesList.length],
              ['unlocked', 'Ready to Learn', counts.unlocked],
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
        {/* World — transform driven directly via DOM ref; no React re-render on pan/zoom */}
        <div
          className="sg-world"
          ref={worldRef}
          style={{ width: layout.worldW, height: layout.worldH }}
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
                  <span className="sg-i-dot" style={{ background: `hsl(${clusterHue(island.cluster)} 62% 55%)` }} />
                  {clusterTitle(island.cluster)}
                </span>
                <div className="sg-i-head-actions">
                  <span className="sg-i-meta">
                    {island.islandNodes.length} skills
                    {island.localMax > 0 ? ` · ${island.localMax + 1} layers` : ''}
                  </span>
                  <button
                    type="button"
                    className="sg-i-focus-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCluster(island.cluster);
                    }}
                    title={`Hide ${clusterTitle(island.cluster)} block`}
                  >
                    Hide
                  </button>
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
              {['unlocked', 'locked'].map((status) => (
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
              const edgeStatus = (edge.status === 'unlocked' || edge.status === 'mastered') ? 'unlocked' : 'locked';
              return (
                <path
                  key={`${edge.from}->${edge.to}`}
                  d={edge.d}
                  className={`sg-edge to-${edgeStatus}${edge.cross ? ' cross' : ''}${isHot ? ' hot' : ''}${isDim ? ' dim' : ''}`}
                  style={{ animationDelay: `${140 + edge.layer * 110}ms` }}
                  markerEnd={`url(#sg-arrow-${edgeStatus})`}
                />
              );
            })}
          </svg>

          {/* Nodes Container */}
          <div id="sg-nodes-container">
            {layout.nodesList.map((n, i) => {
              const isSelected = selectedNodeId === n.id;
              const isConnected =
                hoveredNodeId &&
                (hoveredNodeId === n.id ||
                  childrenOf(hoveredNodeId).includes(n.id) ||
                  parentsOf(hoveredNodeId).includes(n.id));
              const isDim = hoveredNodeId && !isConnected;

              const parentSkills = parentsOf(n.id);
              const parentNode = parentSkills.length > 0 ? (layout.byId.get(parentSkills[0]) || layout.fullById?.get(parentSkills[0])) : null;
              const subText = (n.status === 'unlocked' || n.status === 'mastered')
                ? 'Ready to Learn'
                : parentSkills.length > 0
                ? `Needs ${parentNode?.label || 'Parent'}${parentSkills.length > 1 ? ` +${parentSkills.length - 1}` : ''}`
                : 'Root Skill';

              return (
                <SkillNode
                  key={n.id}
                  n={n}
                  isSelected={isSelected}
                  isDim={!!isDim}
                  isJustUnlocked={Boolean(recentlyUnlockedId && (n.id === recentlyUnlockedId || n.slug === recentlyUnlockedId))}
                  subText={subText}
                  animDelay={`${Math.min((n.layer || 0) * 110, 700) + (i % 5) * 70}ms`}
                  onClick={() => handleNodeClick(n.id)}
                  onMouseEnter={() => handleNodeMouseEnter(n.id)}
                  onMouseLeave={handleNodeMouseLeave}
                  onKeyDown={(e) => handleNodeKeyDown(e, n.id)}
                />
              );
            })}
          </div>
        </div>

        {/* Empty state when no blocks are checked */}
        {layout.nodesList.length === 0 && (
          <div className="sg-empty-blocks-overlay">
            <div className="sg-empty-blocks-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div className="sg-empty-blocks-title">No Blocks Visible</div>
            <div className="sg-empty-blocks-desc">Check one or more blocks from the dropdown above to display skills on the graph.</div>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="sg-zoomctl">
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
          <span className="sg-zlabel">{zoomLabel}%</span>
        </div>

        {/* Detail Panel */}
        <aside className={`sg-panel ${selectedNode ? 'open' : ''}`}>
          {selectedNode && (
            <>
              <button className="sg-panel-close" onClick={() => setSelectedNodeId(null)} aria-label="Close">
                &#10005;
              </button>
              <div className={`sg-p-badge ${selectedNode.status === 'unlocked' || selectedNode.status === 'mastered' ? 'unlocked' : 'locked'}`}>
                {ICONS[(selectedNode.status === 'unlocked' || selectedNode.status === 'mastered') ? 'check' : 'lock']}
                <span>
                  {selectedNode.status === 'unlocked' || selectedNode.status === 'mastered'
                    ? 'Ready to Learn'
                    : 'Locked'}
                </span>
              </div>
              <h2>{selectedNode.label}</h2>
              <p className="sg-p-cluster">{clusterTitle(selectedNode.cluster)} cluster</p>
              <p className="sg-desc">{selectedNode.desc}</p>

              <div className="sg-rel">
                <h4>Requires</h4>
                <div className="sg-chips">
                  {parentsOf(selectedNode.id).length > 0 ? (
                    parentsOf(selectedNode.id).map((parentId) => {
                      const p = layout.byId.get(parentId) || layout.fullById?.get(parentId);
                      const isHiddenCluster = p && !selectedClusters.includes(p.cluster);
                      return (
                        <button
                          key={parentId}
                          onClick={() => {
                            if (p && !selectedClusters.includes(p.cluster)) {
                              handleEnsureClusterVisible(p.cluster);
                            }
                            setSelectedNodeId(parentId);
                          }}
                          title={p ? `${p.label} (${clusterTitle(p.cluster)})` : parentId}
                        >
                          {p?.label || parentId}
                          {isHiddenCluster && (
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
                      const isHiddenCluster = c && !selectedClusters.includes(c.cluster);
                      return (
                        <button
                          key={childId}
                          onClick={() => {
                            if (c && !selectedClusters.includes(c.cluster)) {
                              handleEnsureClusterVisible(c.cluster);
                            }
                            setSelectedNodeId(childId);
                          }}
                          title={c ? `${c.label} (${clusterTitle(c.cluster)})` : childId}
                        >
                          {c?.label || childId}
                          {isHiddenCluster && (
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
                className={`sg-p-cta ${selectedNode.status === 'unlocked' || selectedNode.status === 'mastered' ? 'unlocked' : 'locked'}`}
                onClick={() => {
                  if (selectedNode.status === 'locked') {
                    setQuizNode(selectedNode);
                    setIsQuizModalOpen(true);
                  } else {
                    navigate('/roadmap');
                  }
                }}
              >
                {selectedNode.status === 'unlocked' || selectedNode.status === 'mastered'
                  ? 'Review notes'
                  : 'Unlock path'}
              </button>
            </>
          )}
        </aside>

        {/* 5-Question Node Unlock Quiz Modal */}
        <SkillQuizModal
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          node={quizNode}
          onSuccess={handleQuizSuccess}
        />
      </div>
    </div>
  );
}

const ICON_HINTS = [
  [/sql|data|model/i, 'database'],
  [/linux|shell|cli/i, 'terminal'],
  [/git/i, 'git'],
  [/http|api|distrib|rest/i, 'globe'],
  [/layer|arch/i, 'layers'],
  [/inject|share/i, 'share'],
  [/conc|cpu|thread/i, 'cpu'],
  [/pattern|solid/i, 'shapes'],
  [/queue|message|mail/i, 'mail'],
  [/monit|trace|observ|log/i, 'activity'],
  [/test|ci/i, 'code'],
  [/cache|zap|redis/i, 'zap'],
  [/sys|scale|net/i, 'network'],
];

export const SEED_BACKEND_PREREQS = {
  'core-data-structures': ['programming-basics'],
  'error-handling': ['programming-basics'],
  'oop-modular-design': ['programming-basics'],
  'http-basics': ['networking-basics'],
  'json-serialization': ['programming-basics'],
  'rest-api-design': ['http-basics', 'json-serialization'],
  'input-validation-errors': ['rest-api-design', 'error-handling'],
  'api-docs-openapi': ['rest-api-design'],
  'pagination-versioning': ['rest-api-design'],
  'realtime-communication': ['rest-api-design'],
  'sql-joins-aggregation': ['sql-basics'],
  'relational-modeling': ['sql-basics'],
  'orm-data-access': ['sql-basics', 'oop-modular-design'],
  'nosql-basics': ['sql-basics', 'json-serialization'],
  'schema-migrations': ['relational-modeling'],
  'indexing-query-performance': ['relational-modeling', 'sql-joins-aggregation'],
  'transactions-acid': ['sql-joins-aggregation'],
  'isolation-concurrency': ['transactions-acid', 'concurrency-basics'],
  'replication-sharding': ['indexing-query-performance', 'transactions-acid'],
  'password-hashing': ['http-basics'],
  'sessions-cookies': ['http-basics', 'password-hashing'],
  'jwt-auth': ['sessions-cookies', 'json-serialization'],
  'authorization-rbac': ['jwt-auth'],
  'secrets-management': ['git-basics', 'linux-cli-basics'],
  'web-security-owasp': ['rest-api-design', 'sql-basics'],
  'rate-limiting': ['rest-api-design', 'caching-basics'],
  'oauth2-oidc': ['jwt-auth'],
  'layered-architecture': ['oop-modular-design', 'rest-api-design'],
  'dependency-injection': ['oop-modular-design', 'solid-principles'],
  'solid-principles': ['oop-modular-design'],
  'design-patterns': ['solid-principles'],
  'monolith-vs-microservices': ['layered-architecture'],
  'system-design-scalability': ['monolith-vs-microservices', 'replication-sharding', 'load-balancing'],
  'caching-basics': ['core-data-structures', 'rest-api-design'],
  'redis-in-memory': ['caching-basics', 'nosql-basics'],
  'load-balancing': ['http-basics', 'caching-basics'],
  'concurrency-basics': ['programming-basics'],
  'async-programming': ['concurrency-basics'],
  'background-jobs': ['async-programming', 'redis-in-memory'],
  'message-queues': ['background-jobs'],
  'idempotency-retries': ['message-queues', 'rest-api-design'],
  'distributed-consistency': ['replication-sharding', 'message-queues'],
  'unit-testing': ['programming-basics'],
  'test-doubles': ['unit-testing'],
  'api-integration-testing': ['unit-testing', 'rest-api-design'],
  'logging-monitoring': ['error-handling'],
  'observability-tracing': ['logging-monitoring', 'monolith-vs-microservices'],
  'docker-basics': ['linux-cli-basics'],
  'ci-cd-basics': ['git-basics', 'unit-testing', 'docker-basics'],
  'cloud-deployment': ['docker-basics', 'networking-basics', 'secrets-management'],
  'container-orchestration': ['docker-basics', 'load-balancing'],
};

export const SEED_SLUG_BY_SKILL_ID = {
  '26a42514-d3df-3878-a487-9dbe1541d761': 'programming-basics',
  '8f5784a6-359c-3f86-9293-c2cdb5302302': 'core-data-structures',
  '3b4fefd0-eb85-3c11-bb11-407ca5c1fc70': 'git-basics',
  '703d38df-a127-3ee8-81cc-e08f5edb8af6': 'linux-cli-basics',
  'caa40c77-d817-3f9e-b0aa-fde3ae4ec4a3': 'error-handling',
  '40d5cca9-87d0-377f-b682-0f04c246d3bc': 'oop-modular-design',
  'eeff4de8-63f3-3133-abb8-f9b4927611a6': 'networking-basics',
  '9e54ff99-b6a9-319b-a01d-ec536db28d85': 'http-basics',
  '000986e0-4827-322a-85e8-cd2cdda9943b': 'json-serialization',
  '79b2e9c2-87fb-377d-b6e4-389c789e16e5': 'rest-api-design',
  '80ed19f8-da89-3753-a342-069c68760b78': 'input-validation-errors',
  'e5988fac-adf3-36bc-8ca0-c80e0118426c': 'api-docs-openapi',
  '53b73062-a751-3f71-9f10-187ce7d1f66b': 'pagination-versioning',
  '6147e69f-afd4-3620-a8a3-40dced3d9985': 'realtime-communication',
  '79e362bf-db7f-3f96-8977-462ab388ca83': 'sql-basics',
  '4785bb25-7adb-367c-80bd-ade5300113e9': 'sql-joins-aggregation',
  'c9289f91-c8db-3ee8-bb65-76ec14cae88b': 'relational-modeling',
  '5e70a4fa-6e68-39f1-9dbe-6a53e350546d': 'orm-data-access',
  '520416f7-b6bc-377d-8348-e96d43060d20': 'nosql-basics',
  'c1085a99-721f-3147-afdc-5984bd3584d9': 'schema-migrations',
  'e301966d-45fc-3be7-87b9-3c23eacbea85': 'indexing-query-performance',
  '64b2815b-c4ec-3bf5-adc8-9d475830e90c': 'transactions-acid',
  '7b1f3ab3-0b17-3055-8f37-0516f6b9540d': 'isolation-concurrency',
  '3efc577e-8ef7-3a1e-8604-cbb5275ab845': 'replication-sharding',
  'eb9b5b52-7987-3cfc-8724-2a1e54faee8e': 'password-hashing',
  '2f82916b-8bc3-36cf-b0cc-35fc2e70f94a': 'sessions-cookies',
  'aaf5c703-a94f-3cc3-b909-216933ed1a49': 'jwt-auth',
  '5c6ab2b1-2100-337f-918d-f434bb6708c7': 'authorization-rbac',
  '12ac4e0b-61bb-323a-908c-2cf8a1a0b04d': 'secrets-management',
  '4b85ecf7-c5f7-361a-9748-d32234890a9e': 'web-security-owasp',
  '9c0853df-465e-3d5c-b7fc-d26f31c16207': 'rate-limiting',
  '2acb5676-92d7-3efb-b4ec-afefd043da39': 'oauth2-oidc',
  'da754eec-78f5-3b1f-9c60-241dcae74fa5': 'layered-architecture',
  '3be6abf6-4658-318f-86b4-a219c8c8550b': 'dependency-injection',
  'a6296bbc-6809-3b64-983d-eda80d3f648b': 'solid-principles',
  '7f09a2b5-3a7f-3cc6-a1a4-6a4564509fc7': 'design-patterns',
  '34520bf9-8ce2-3d32-91eb-1f346c469af6': 'monolith-vs-microservices',
  '8c3db95f-2c65-3c40-b620-cc420fccbdf3': 'system-design-scalability',
  '265606a1-c676-325b-b474-577fc3e23c33': 'caching-basics',
  '60e46021-ee1f-3eec-92be-56c8cee30153': 'redis-in-memory',
  'c528a3b2-5c61-3675-b4b7-85b676c6f337': 'load-balancing',
  '106c29cc-5aec-3591-9c9c-32576f3765d5': 'concurrency-basics',
  'a6239add-965f-3dac-9150-13b1bbb140ad': 'async-programming',
  '2c2256a1-8406-339f-a117-780396827b45': 'background-jobs',
  '7788163c-5caa-3a72-ab22-10e1a8b36fb6': 'message-queues',
  'b527904a-1f18-30a5-b47e-8d33748c018f': 'idempotency-retries',
  '6d107837-6678-3fd2-834f-f64538d830c8': 'distributed-consistency',
  'd2f8c361-a116-3d28-a8e7-59aa1d26f16c': 'unit-testing',
  'a8a4fb25-ceed-3c3d-908f-b99f3f81c2aa': 'test-doubles',
  '78a81edb-233b-3e37-ac95-1a704f2263f8': 'api-integration-testing',
  'd27c0b15-62c3-35e8-99cd-8df3e45b4eb9': 'logging-monitoring',
  '3877a850-d6f0-3849-a987-76c5d501bc5f': 'observability-tracing',
  'eda11238-d419-345b-aa1d-2ddc3e03d89e': 'docker-basics',
  '84318154-9479-36ae-aa18-577f0fcc34b1': 'ci-cd-basics',
  '26cf4657-e02e-3393-8c73-66aed673a640': 'cloud-deployment',
  '26715e53-f440-3e09-bb90-8522b209fafa': 'container-orchestration',
};

const CLUSTER_TITLES = {
  'web-apis': 'Web Services & REST APIs',
  'async-distributed': 'Async & Distributed Systems',
  'quality-observability': 'Quality & Observability',
};

export function toSkillSlug(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function clusterTitle(cluster) {
  const key = (cluster || '').toString().trim();
  if (!key) return 'Core';
  if (CLUSTER_TITLES[key.toLowerCase()]) return CLUSTER_TITLES[key.toLowerCase()];
  return key
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function iconFor(name = '', cluster = '') {
  const text = `${name} ${cluster}`;
  for (const [re, icon] of ICON_HINTS) if (re.test(text)) return icon;
  return 'box';
}

function emptyModel() {
  return {
    nodes: [],
    edges: [],
    isLive: false,
    clusterCount: 0,
    edgeCount: 0,
    maxLayer: 0,
  };
}

function normalizePrereqList(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v)).filter(Boolean);
    } catch {
      if (value.trim()) return [value.trim()];
    }
  }
  if (typeof value === 'object') return Object.keys(value).map(String);
  return [];
}

export function buildGraphModel(skills) {
  const list = Array.isArray(skills) ? skills : [];
  const usable = list.filter(Boolean);
  if (usable.length === 0) return emptyModel();

  const nodes = [];
  const byId = new Map();
  const bySeedSlug = new Map();
  const byNameSlug = new Map();

  usable.forEach((s, index) => {
    const id = String(s.skillId || s.slug || s.id || s.name || `skill-${index}`);
    const rawStatus = String(s.state || 'locked').toLowerCase();
    const status = rawStatus === 'mastered' ? 'unlocked' : rawStatus;
    const nameSlug = toSkillSlug(s.name);
    let seedSlug = SEED_SLUG_BY_SKILL_ID[id] || null;
    if (!seedSlug && SEED_BACKEND_PREREQS[nameSlug]) seedSlug = nameSlug;
    const prereqRefs = normalizePrereqList(s.prerequisites);
    const node = {
      id,
      seedSlug,
      nameSlug,
      label: s.name || s.slug || id,
      cluster: (s.cluster || '').toString() || 'core',
      icon: iconFor(s.name || s.slug || id, clusterTitle(s.cluster)),
      status: ['unlocked', 'frontier', 'locked'].includes(status) ? status : 'locked',
      progress: status === 'frontier' ? Math.min(90, Math.max(15, Math.round(Number(s.progress) || 50))) : 0,
      desc: s.description
        || `${s.name || s.slug || id} competency in ${(s.cluster || 'backend').toString()} — evaluated by the adaptive IRT diagnostic.`,
      prereqRefs,
      prerequisites: [],
      order: index,
    };
    nodes.push(node);
    byId.set(node.id, node);
    if (node.seedSlug) bySeedSlug.set(node.seedSlug, node);
    byNameSlug.set(node.nameSlug, node);
  });

  const resolveRef = (ref) => {
    if (ref == null || ref === '') return null;
    const rawStr = String(ref);
    if (byId.has(rawStr)) return rawStr;
    const refSlug = toSkillSlug(rawStr);
    return bySeedSlug.get(refSlug)?.id || byNameSlug.get(refSlug)?.id || null;
  };

  const edgeSet = new Set();
  const edges = [];
  const attach = (node) => {
    const parents = [];
    node.prereqRefs.forEach((ref) => {
      const parentId = resolveRef(ref);
      if (parentId && parentId !== node.id) parents.push(parentId);
    });
    if (parents.length === 0 && node.seedSlug && SEED_BACKEND_PREREQS[node.seedSlug]) {
      SEED_BACKEND_PREREQS[node.seedSlug].forEach((slug) => {
        const parentId = bySeedSlug.get(slug)?.id;
        if (parentId && parentId !== node.id) parents.push(parentId);
      });
    }
    parents.forEach((parentId) => {
      const key = `${parentId}\u0000${node.id}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ from: parentId, to: node.id });
      }
    });
    node.prerequisites = parents;
  };

  nodes.forEach(attach);

  if (edges.length === 0) {
    nodes.forEach((node) => {
      node.prereqRefs = [];
      node.prerequisites = [];
    });
    edgeSet.clear();
    nodes.forEach((node) => {
      if (!node.seedSlug || !SEED_BACKEND_PREREQS[node.seedSlug]) return;
      SEED_BACKEND_PREREQS[node.seedSlug].forEach((slug) => {
        const parentId = bySeedSlug.get(slug)?.id;
        if (parentId && parentId !== node.id) {
          node.prerequisites.push(parentId);
          const key = `${parentId}\u0000${node.id}`;
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            edges.push({ from: parentId, to: node.id });
          }
        }
      });
    });
  }

  const parentMap = new Map(nodes.map((n) => [n.id, []]));
  edges.forEach(({ from, to }) => {
    if (parentMap.has(to)) parentMap.get(to).push(from);
  });

  const layerById = new Map();
  const visiting = new Set();
  const layerOf = (id) => {
    if (layerById.has(id)) return layerById.get(id);
    if (visiting.has(id)) return 0;
    visiting.add(id);
    let layer = 0;
    (parentMap.get(id) || []).forEach((p) => {
      layer = Math.max(layer, layerOf(p) + 1);
    });
    visiting.delete(id);
    layerById.set(id, layer);
    return layer;
  };
  nodes.forEach((n) => layerOf(n.id));
  nodes.forEach((n) => {
    n.layer = layerById.get(n.id) || 0;
  });

  const clusterMap = new Map();
  nodes.forEach((n) => {
    if (!clusterMap.has(n.cluster)) clusterMap.set(n.cluster, []);
    clusterMap.get(n.cluster).push(n);
  });

  return {
    nodes,
    edges,
    isLive: true,
    clusterCount: clusterMap.size,
    edgeCount: edges.length,
    maxLayer: nodes.reduce((m, n) => Math.max(m, n.layer), 0),
  };
}

const LAYOUT = {
  NODE_W: 216,
  NODE_H: 58,
  COL: 272,
  ROWG: 22,
  IPAD: 20,
  HEAD_H: 44,
  HEAD_PAD: 24,
  FOOT_PAD: 20,
  ISLAND_GAP_X: 52,
  ISLAND_GAP_Y: 72,
  ROW_MAX_W: 4360,
  PAD_X: 60,
  PAD_Y: 56,
};

function localLayers(nodes, edges) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const parentsOf = new Map(nodes.map((n) => [n.id, []]));
  edges.forEach(({ from, to }) => {
    if (byId.has(from) && byId.has(to) && from !== to) parentsOf.get(to).push(from);
  });
  const memo = new Map();
  const visiting = new Set();
  const layerOf = (id) => {
    if (memo.has(id)) return memo.get(id);
    if (visiting.has(id)) return 0;
    visiting.add(id);
    let layer = 0;
    (parentsOf.get(id) || []).forEach((p) => {
      layer = Math.max(layer, layerOf(p) + 1);
    });
    visiting.delete(id);
    memo.set(id, layer);
    return layer;
  };
  nodes.forEach((n) => layerOf(n.id));
  return { layerOf, parentsOf };
}

function islandLayout(islandNodes, islandEdges) {
  const { layerOf, parentsOf } = localLayers(islandNodes, islandEdges);
  const byLayer = new Map();

  if (islandEdges.length === 0) {
    islandNodes.forEach((n, i) => {
      const L = Math.floor(i / 4);
      if (!byLayer.has(L)) byLayer.set(L, []);
      byLayer.get(L).push(n);
    });
  } else {
    islandNodes.forEach((n) => {
      const L = layerOf(n.id);
      if (!byLayer.has(L)) byLayer.set(L, []);
      byLayer.get(L).push(n);
    });
  }

  const colOrder = [...byLayer.keys()].sort((a, b) => a - b);
  const rowIndexOf = new Map();
  const sortedDone = new Set();
  const rows = new Map();

  colOrder.forEach((L) => {
    const arr = byLayer
      .get(L)
      .slice()
      .sort((a, b) => {
        const pa = (parentsOf.get(a.id) || []).filter((p) => sortedDone.has(p));
        const pb = (parentsOf.get(b.id) || []).filter((p) => sortedDone.has(p));
        const ka = pa.length ? pa.reduce((s, p) => s + rowIndexOf.get(p), 0) / pa.length : a.order;
        const kb = pb.length ? pb.reduce((s, p) => s + rowIndexOf.get(p), 0) / pb.length : b.order;
        return ka - kb || (a.order ?? 0) - (b.order ?? 0);
      });
    const rowsArr = [];
    arr.forEach((n, row) => {
      rowsArr.push(n);
      rowIndexOf.set(n.id, row);
      sortedDone.add(n.id);
    });
    rows.set(L, rowsArr);
  });

  return {
    colOrder,
    rows,
    maxRows: Math.max(1, ...colOrder.map((L) => rows.get(L).length)),
    localMax: islandEdges.length === 0 ? 0 : Math.max(0, ...colOrder),
  };
}

export const clusterHue = (cluster) =>
  [...(cluster || 'core')].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) % 100000, 7) % 360;

export function computeLayout(graph, clusterFilter = 'all') {
  let activeNodes;
  let isFiltered = false;
  if (Array.isArray(clusterFilter) || clusterFilter instanceof Set) {
    const selectedSet = new Set(clusterFilter);
    activeNodes = graph.nodes.filter((n) => selectedSet.has(n.cluster));
    isFiltered = true;
  } else if (clusterFilter && clusterFilter !== 'all') {
    activeNodes = graph.nodes.filter((n) => n.cluster === clusterFilter);
    isFiltered = true;
  } else {
    activeNodes = graph.nodes.slice();
  }

  const fullById = new Map(graph.nodes.map((n) => [n.id, n]));
  const fullChildren = new Map(Array.from(fullById.keys()).map((id) => [id, []]));
  const fullParents = new Map(Array.from(fullById.keys()).map((id) => [id, []]));
  graph.edges.forEach(({ from, to }) => {
    fullChildren.get(from)?.push(to);
    fullParents.get(to)?.push(from);
  });

  if (activeNodes.length === 0) {
    return {
      byId: new Map(),
      fullById,
      islands: [],
      nodesList: [],
      edgePaths: [],
      children: new Map(),
      parents: new Map(),
      fullChildren,
      fullParents,
      worldW: 400 + LAYOUT.PAD_X,
      worldH: 200 + LAYOUT.PAD_Y,
      isFiltered: true,
      selectedCluster: clusterFilter,
      nodeW: LAYOUT.NODE_W,
      nodeH: LAYOUT.NODE_H,
    };
  }

  const byId = new Map(activeNodes.map((n) => [n.id, n]));
  const clusters = new Map();
  activeNodes.forEach((n) => {
    if (!clusters.has(n.cluster)) clusters.set(n.cluster, []);
    clusters.get(n.cluster).push(n);
  });

  const islandDefs = [...clusters.entries()].map(([cluster, islandNodes]) => {
    const islandIds = new Set(islandNodes.map((n) => n.id));
    const islandEdges = graph.edges.filter((e) => islandIds.has(e.from) && islandIds.has(e.to));
    const { colOrder, rows, maxRows, localMax } = islandLayout(islandNodes, islandEdges);
    return { cluster, islandNodes, colOrder, rows, maxRows, localMax };
  });

  islandDefs.forEach((d) => {
    d.minGlobalLayer = Math.min(...d.islandNodes.map((n) => n.layer));
    d.width =
      LAYOUT.IPAD * 2 +
      (d.localMax > 0 ? d.localMax : 0) * LAYOUT.COL +
      LAYOUT.NODE_W;
    d.height =
      LAYOUT.HEAD_H +
      LAYOUT.HEAD_PAD +
      d.maxRows * LAYOUT.NODE_H +
      (d.maxRows - 1) * LAYOUT.ROWG +
      LAYOUT.FOOT_PAD;
  });

  islandDefs.sort((a, b) => {
    if (a.minGlobalLayer !== b.minGlobalLayer) return a.minGlobalLayer - b.minGlobalLayer;
    if (a.islandNodes.length !== b.islandNodes.length) return a.islandNodes.length - b.islandNodes.length;
    return (a.cluster || '').localeCompare(b.cluster || '');
  });

  let cursorX = 0;
  let cursorY = 0;
  let maxRowBottom = 0;
  islandDefs.forEach((d) => {
    if (cursorX > 0 && cursorX + d.width > LAYOUT.ROW_MAX_W) {
      cursorX = 0;
      cursorY = maxRowBottom + LAYOUT.ISLAND_GAP_Y;
    }
    d.x = cursorX;
    d.y = cursorY;
    cursorX += d.width + LAYOUT.ISLAND_GAP_X;
    maxRowBottom = Math.max(maxRowBottom, d.y + d.height);
  });

  islandDefs.forEach((island) => {
    const contentH =
      island.maxRows * LAYOUT.NODE_H +
      (island.maxRows - 1) * LAYOUT.ROWG;
    island.colOrder.forEach((L, col) => {
      const arr = island.rows.get(L);
      const colH = arr.length * LAYOUT.NODE_H + (arr.length - 1) * LAYOUT.ROWG;
      const y0 = island.y + LAYOUT.HEAD_H + LAYOUT.HEAD_PAD + (contentH - colH) / 2;
      arr.forEach((n, row) => {
        n.x = island.x + LAYOUT.IPAD + col * LAYOUT.COL;
        n.y = y0 + row * (LAYOUT.NODE_H + LAYOUT.ROWG);
      });
    });
  });

  const children = new Map(Array.from(byId.keys()).map((id) => [id, []]));
  const parents = new Map(Array.from(byId.keys()).map((id) => [id, []]));

  const edgePaths = [];
  const maxBottom = Math.max(maxRowBottom, ...islandDefs.map((d) => d.y + d.height), 200);
  const worldH = maxBottom + LAYOUT.PAD_Y;

  graph.edges.forEach(({ from, to }) => {
    const a = byId.get(from);
    const b = byId.get(to);
    if (!a || !b) return;
    children.get(from)?.push(to);
    parents.get(to)?.push(from);

    const cross = a.cluster !== b.cluster;
    let d;
    if (!cross) {
      const x1 = a.x + LAYOUT.NODE_W;
      const y1 = a.y + LAYOUT.NODE_H / 2;
      const x2 = b.x;
      const y2 = b.y + LAYOUT.NODE_H / 2;
      const dx = Math.max(46, (x2 - x1) * 0.5);
      d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    } else {
      const x1 = a.x + LAYOUT.NODE_W / 2;
      const y1 = a.y + LAYOUT.NODE_H;
      const x2 = b.x + LAYOUT.NODE_W / 2;
      const y2 = b.y;
      const cy = Math.min(worldH - 24, Math.max(y1, y2) + 130);
      d = `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`;
    }
    edgePaths.push({ from, to, d, status: b.status, cross, layer: a.layer });
  });

  const worldW = Math.max(...islandDefs.map((d) => d.x + d.width), 400) + LAYOUT.PAD_X;

  return {
    byId,
    fullById,
    islands: islandDefs,
    nodesList: activeNodes.slice(),
    edgePaths,
    children,
    parents,
    fullChildren,
    fullParents,
    worldW,
    worldH,
    isFiltered,
    selectedCluster: isFiltered ? clusterFilter : 'all',
    nodeW: LAYOUT.NODE_W,
    nodeH: LAYOUT.NODE_H,
  };
}

import { apiClient } from './api';

const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

export const TRACK_UUIDS = {
  fullstack: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  backend: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  devops: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  'ai-data': 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getTrackUuid(trackIdOrSlug) {
  if (!trackIdOrSlug) return TRACK_UUIDS.fullstack;
  if (UUID_REGEX.test(trackIdOrSlug)) return trackIdOrSlug;
  return TRACK_UUIDS[trackIdOrSlug] || TRACK_UUIDS.fullstack;
}

// ---------------------------------------------------------------------------
// Realistic Mock Computer Adaptive Testing (CAT) Session Simulator
// ---------------------------------------------------------------------------

const MOCK_QUESTION_BANK = [
  {
    itemId: 'mock-item-1',
    area: 'Prerequisites & Foundations',
    stem: 'What is the primary difference between a process and a thread in modern operating systems?',
    options: [
      'Processes share memory by default, threads do not',
      'Threads share the address space of their parent process, while processes have isolated address spaces',
      'Threads have separate kernel page tables, processes do not',
      'Processes cannot spawn multiple threads',
    ],
    correctOption: 1,
    difficulty: 0.0,
  },
  {
    itemId: 'mock-item-2',
    area: 'Core Conceptual Understanding',
    stem: 'In the JavaScript runtime event loop, which queue is prioritized and drained immediately after the call stack clears?',
    options: [
      'Macrotask Queue (setTimeout, setInterval)',
      'Microtask Queue (Promises, queueMicrotask)',
      'RequestAnimationFrame Queue',
      'I/O Socket Polling Queue',
    ],
    correctOption: 1,
    difficulty: 0.25,
  },
  {
    itemId: 'mock-item-3',
    area: 'Theory & Architecture',
    stem: 'Why does React require immutable state updates rather than direct in-place property mutations?',
    options: [
      'JavaScript V8 garbage collector throws errors on in-place mutations',
      'Shallow reference comparisons (Object.is) allow React to reliably detect changes and trigger reconciliations',
      'Mutable state exposes browser sessions to XSS injection attacks',
      'In-place mutations double memory usage in the heap',
    ],
    correctOption: 1,
    difficulty: 0.35,
  },
  {
    itemId: 'mock-item-4',
    area: 'Syntax & Mechanics',
    stem: 'Which HTTP caching header enables conditional request validation with the origin server via entity tags?',
    options: [
      'ETag / If-None-Match',
      'Cache-Control: no-cache',
      'Strict-Transport-Security',
      'Transfer-Encoding: chunked',
    ],
    correctOption: 0,
    difficulty: 0.45,
  },
  {
    itemId: 'mock-item-5',
    area: 'Practical Problem-Solving',
    stem: 'In relational database indexing, which tree-based data structure maintains sorted balance to guarantee O(log N) lookups and efficient sequential range scans?',
    options: [
      'Binary Search Tree',
      'B+ Tree',
      'Red-Black Tree',
      'Trie / Radix Tree',
    ],
    correctOption: 1,
    difficulty: 0.6,
  },
  {
    itemId: 'mock-item-6',
    area: 'System Architecture',
    stem: 'When scaling distributed microservices, which strategy provides write-around caching while avoiding stale reads across stateless replicas?',
    options: [
      'Read-Through with Redis and TTL invalidation',
      'Write-Behind asynchronous message buffer',
      'Local JVM in-memory caching without pub/sub sync',
      'Direct disk filesystem serialization',
    ],
    correctOption: 0,
    difficulty: 0.8,
  },
];

const MOCK_STORAGE_KEY = 'skillpath_mock_cat_session';

function getMockSession() {
  try {
    const raw = sessionStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    assessmentId: 'mock-cat-session-001',
    currentIndex: 0,
    answeredCount: 0,
    correctCount: 0,
    theta: 0.0,
    done: false,
    history: [],
  };
}

function saveMockSession(sess) {
  try {
    sessionStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(sess));
  } catch {
    // ignore
  }
}

function getMockStateFromSession(sess) {
  const isDone = sess.done || sess.answeredCount >= 6;
  const currentQ = !isDone ? MOCK_QUESTION_BANK[sess.currentIndex] : null;

  return {
    assessmentId: sess.assessmentId,
    status: isDone ? 'COMPLETED' : 'IN_PROGRESS',
    done: isDone,
    question: currentQ
      ? {
          itemId: currentQ.itemId,
          stem: currentQ.stem,
          options: currentQ.options,
          area: currentQ.area,
        }
      : null,
    answered: sess.answeredCount,
    max: 9,
    progress: {
      answered: sess.answeredCount,
      max: 9,
    },
  };
}

function computeMockResult(sess) {
  let level = 'INTERMEDIATE';
  if (sess.theta > 0.75) level = 'ADVANCED';
  else if (sess.theta < -0.5) level = 'BEGINNER';

  return {
    assessmentId: sess.assessmentId,
    level,
    theta: parseFloat(sess.theta.toFixed(2)),
    answered: sess.answeredCount,
    correct: sess.correctCount,
    skills: [
      {
        skillId: 'sk-1',
        name: 'JavaScript Fundamentals & Closures',
        cluster: 'Core Language Mechanics',
        state: 'MASTERED',
      },
      {
        skillId: 'sk-2',
        name: 'HTTP & RESTful Protocols',
        cluster: 'Web Protocols',
        state: 'MASTERED',
      },
      {
        skillId: 'sk-3',
        name: 'Event Loop & Microtask Queues',
        cluster: 'Asynchronous Architecture',
        state: sess.correctCount >= 3 ? 'MASTERED' : 'FRONTIER',
      },
      {
        skillId: 'sk-4',
        name: 'Database Indexing & B-Trees',
        cluster: 'Data Storage & Optimization',
        state: 'FRONTIER',
      },
      {
        skillId: 'sk-5',
        name: 'Distributed Caching (Redis / Write-Around)',
        cluster: 'System Architecture',
        state: 'FRONTIER',
      },
      {
        skillId: 'sk-6',
        name: 'Distributed Consensus & Paxos',
        cluster: 'System Architecture',
        state: 'LOCKED',
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Assessment Service API Layer
// ---------------------------------------------------------------------------

export const assessmentService = {
  /**
   * Start a new test or resume an existing active one for a track.
   * @param {string} trackIdOrSlug - UUID or track slug.
   * @returns {Promise<object>} AssessmentState
   */
  async startOrResume(trackIdOrSlug) {
    const trackId = getTrackUuid(trackIdOrSlug);

    if (USE_MOCK_AUTH) {
      const sess = getMockSession();
      return getMockStateFromSession(sess);
    }

    return apiClient('/api/v1/assessments', {
      method: 'POST',
      body: { trackId },
    });
  },

  /**
   * Fetch current state by assessment ID (for page reloads or active sessions).
   * @param {string} assessmentId - UUID of the assessment.
   * @returns {Promise<object>} AssessmentState
   */
  async getState(assessmentId) {
    if (USE_MOCK_AUTH) {
      const sess = getMockSession();
      return getMockStateFromSession(sess);
    }

    return apiClient(`/api/v1/assessments/${assessmentId}`, {
      method: 'GET',
    });
  },

  /**
   * Submit an answer to the current question.
   * @param {string} assessmentId - UUID of the assessment.
   * @param {string} itemId - UUID of the current question.
   * @param {number} selectedOption - 0-indexed integer corresponding to choice.
   * @returns {Promise<object>} AssessmentState
   */
  async submitAnswer(assessmentId, itemId, selectedOption) {
    if (USE_MOCK_AUTH) {
      const sess = getMockSession();
      const currentQ = MOCK_QUESTION_BANK[sess.currentIndex];
      const isCorrect = currentQ ? currentQ.correctOption === selectedOption : true;

      // Update ability parameter (CAT staircase adjustment)
      sess.theta = isCorrect ? sess.theta + 0.35 : Math.max(-1.5, sess.theta - 0.35);
      sess.answeredCount += 1;
      if (isCorrect) sess.correctCount += 1;
      sess.history.push({ itemId, selectedOption, isCorrect });

      // Stop rule: 6 questions in mock session
      if (sess.answeredCount >= 6) {
        sess.done = true;
      } else {
        sess.currentIndex = (sess.currentIndex + 1) % MOCK_QUESTION_BANK.length;
      }

      saveMockSession(sess);
      return getMockStateFromSession(sess);
    }

    return apiClient(`/api/v1/assessments/${assessmentId}/responses`, {
      method: 'POST',
      body: {
        itemId,
        selectedOption,
      },
    });
  },

  /**
   * Retrieve final score and skill results once status is COMPLETED.
   * @param {string} assessmentId - UUID of the completed assessment.
   * @returns {Promise<object>} AssessmentResultView
   */
  async getResult(assessmentId) {
    if (USE_MOCK_AUTH) {
      const sess = getMockSession();
      return computeMockResult(sess);
    }

    return apiClient(`/api/v1/assessments/${assessmentId}/result`, {
      method: 'GET',
    });
  },

  /**
   * Resets mock diagnostic session (used for retesting).
   */
  resetMockSession() {
    try {
      sessionStorage.removeItem(MOCK_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};

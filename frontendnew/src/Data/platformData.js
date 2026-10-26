export const initialUserData = {
  name: "Aarav Sharma",
  role: "Backend Engineer Track",
  college: "Apex Institute of Technology, Pune",
  email: "aarav.sharma@apex.edu.in",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
  streak: 14,
  xp: 1420,
  verifiedScore: 345,
  overallReadiness: 48,
  calibratedLevel: "Beginner"
};

export const learningModules = [
  {
    id: "mod-1",
    title: "HTTP Protocols, REST Architecture & API Design",
    category: "API Engineering",
    relevance: "90% of Job Requirements",
    status: "mastered",
    progress: 100,
    skills: ["REST", "HTTP/2", "OpenAPI", "JSON Schema"]
  },
  {
    id: "mod-2",
    title: "Relational Database Modeling & SQL Index Optimization (PostgreSQL)",
    category: "Database Systems",
    relevance: "92% of Technical Screenings",
    status: "in-progress",
    progress: 64,
    description: "Critical for backend system performance. Cited in 92% of technical screenings. Essential for B-Tree indexing, EXPLAIN query plans, and connection pooling.",
    skills: ["Schema Isolation", "Foreign Keys", "B-Tree Indexing", "Deadlocks & Isolation Levels"]
  },
  {
    id: "mod-3",
    title: "Distributed Caching Strategies & Memory Stores (Redis)",
    category: "Performance & Scale",
    relevance: "88% of Job Requirements",
    status: "in-progress",
    progress: 42,
    skills: ["Cache Stampede", "LRU/LFU Eviction", "Redlock", "Pub/Sub"]
  },
  {
    id: "mod-4",
    title: "Backend Security, JWT Authentication & Access Control (RBAC)",
    category: "Application Security",
    relevance: "84% of Assessment Boards",
    status: "needs-review",
    progress: 35,
    skills: ["OAuth2", "JWT Refresh Rotation", "Argon2/bcrypt", "CSRF Mitigations"]
  },
  {
    id: "mod-5",
    title: "Asynchronous Event Processing & Message Queues (Kafka / RabbitMQ)",
    category: "Distributed Systems",
    relevance: "80% of Senior Positions",
    status: "up-next",
    progress: 0,
    skills: ["Partitioning", "Consumer Groups", "Dead Letter Queues", "Idempotency"]
  }
];

export const diagnosticQuestions = [
  {
    id: 1,
    topic: "Distributed Caching • Cache Stampede & Invalidation",
    question: "What is a 'Cache Stampede' (Thundering Herd) and what is the standard production pattern used to mitigate it?",
    options: [
      { id: "A", text: "Redis re-indexing during network partitions — Mitigated by restarting Redis Sentinel nodes." },
      { id: "B", text: "Simultaneous cache miss on an expired key causing thousands of concurrent requests to hammer the database at once — Mitigated by probabilistic early expiration (XFetch) or mutex locking." },
      { id: "C", text: "Memory leaks caused by improper TTL eviction — Mitigated by switching from LRU to LFU eviction policy." },
      { id: "D", text: "JSON data serialization overflow in Redis memory — Mitigated by using streaming gRPC." }
    ],
    correctAnswer: "B",
    explanation: "Probabilistic early expiration (XFetch) or locking prevents simultaneous DB queries when cache keys expire."
  },
  {
    id: 2,
    topic: "Relational Databases • B-Tree Indexing & Scans",
    question: "Given a composite B-Tree index on (tenant_id, created_at, status), which of the following SQL WHERE clauses can effectively utilize the index for an Index Seek/Scan?",
    options: [
      { id: "A", text: "SELECT * FROM accounts WHERE created_at >= '2026-01-01' AND status = 'active'" },
      { id: "B", text: "SELECT * FROM accounts WHERE tenant_id = 'tenant_42' AND created_at >= '2026-01-01'" },
      { id: "C", text: "SELECT * FROM accounts WHERE status = 'completed'" },
      { id: "D", text: "SELECT * FROM accounts WHERE tenant_id = 'tenant_43' OR status = 'active'" }
    ],
    correctAnswer: "B",
    explanation: "Composite indexes require the leading column (tenant_id) to be present in the filter predicates."
  },
  {
    id: 3,
    topic: "HTTP Protocols & API Design • Status Codes RFC 9110",
    question: "When a client successfully creates a new database resource via a POST request, which HTTP response status code should the API return along with the created resource URI?",
    options: [
      { id: "A", text: "200 OK" },
      { id: "B", text: "201 Created" },
      { id: "C", text: "204 No Content" },
      { id: "D", text: "302 Found" }
    ],
    correctAnswer: "B",
    explanation: "HTTP 201 Created is explicitly reserved for successful resource creation operations."
  }
];

export const flashcards = [
  {
    id: "fc-1",
    category: "Databases & Indexing",
    question: "What is the difference between a Clustered and Non-Clustered Index?",
    answer: "A Clustered Index defines the physical order of data on disk (only 1 per table). A Non-Clustered Index is a separate structure containing pointers to the physical data rows (multiple allowed)."
  },
  {
    id: "fc-2",
    category: "Application Security",
    question: "Why should sensitive JWT tokens be stored in HttpOnly Cookies instead of localStorage?",
    answer: "localStorage is accessible via client-side JavaScript, leaving tokens vulnerable to Cross-Site Scripting (XSS). HttpOnly cookies cannot be read by JS."
  }
];

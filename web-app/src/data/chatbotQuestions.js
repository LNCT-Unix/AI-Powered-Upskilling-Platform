/**
 * 6 Assigned Questions and Knowledge Base for the octoByte Landing Page Chatbot
 */

export const ASSIGNED_QUESTIONS = [
  {
    id: 'cat-assessment',
    shortTitle: 'Adaptive Test',
    tag: 'CAT & IRT Engine',
    question: 'How does the AI adaptive diagnostic test (CAT) work?',
    icon: 'BrainCircuit',
    badge: 'Core Feature',
    answer: `Our diagnostic test uses **Computerized Adaptive Testing (CAT)** powered by the **3-Parameter Logistic (3PL) Item Response Theory (IRT)** model — the exact same scientific standard used in the GRE and GMAT:

• **Calibrates in 7–9 questions**: Instead of a tedious 50-question multiple-choice exam, octoByte re-estimates your true latent ability score (θ) after every single answer.
• **Maximum Fisher Information**: Each question is dynamically selected at your precise boundary of capability to give maximum measurement precision.
• **Scientific stopping rule**: Once our standard error drops below 0.35, the test concludes automatically. The same answers will always produce identical, reproducible results.`,
    actions: [
      { label: 'Start 4-Min Diagnostic Test', route: '/assessment', primary: true },
      { label: 'View How It Works', anchor: '#how' }
    ]
  },
  {
    id: 'skill-graph',
    shortTitle: 'Skill Graph',
    tag: 'Interactive DAG',
    question: 'What is the Interactive Skill Graph and how does it map my learning?',
    icon: 'Network',
    badge: 'Visual Learning',
    answer: `The Skill Graph is an interactive **Directed Acyclic Graph (DAG)** modeling 56 backend engineering competencies across 9 core clusters:

• **9 Core Clusters**: Foundations, Web APIs, Databases, Security, Architecture & Design, Performance, Async & Distributed Systems, Quality & Observability, and DevOps.
• **Color-Coded Mastery States**:
  - 🟢 **Mastered**: Confirmed through diagnostic or project verification.
  - 🟡 **In Progress**: Currently active in your roadmap sprint.
  - 🔵 **Ready to Learn**: Prerequisites are met and unlocked.
  - ⚪ **Locked**: Requires earlier prerequisite skills before unlocking.
• **Prerequisite Integrity**: Ensures you master core database indexing and HTTP fundamentals before jumping into microservices or distributed locks.`,
    actions: [
      { label: 'Explore Skill Graph', route: '/graph', primary: true },
      { label: 'See Cluster List', anchor: '#graph' }
    ]
  },
  {
    id: 'ai-roadmap',
    shortTitle: 'AI Roadmap',
    tag: 'Personalized Plan',
    question: 'How does octoByte generate my personalized learning roadmap?',
    icon: 'GraduationCap',
    badge: 'Targeted Growth',
    answer: `octoByte replaces generic one-size-fits-all bootcamps with **evidence-based learning pathways**:

• **Evidence-Based Sequencing**: Your diagnostic ability baseline (θ) is topologically sorted with your target role to eliminate what you already know and focus only on verified knowledge gaps.
• **Milestone Breakdown**: Each milestone features estimated study hours, high-yield curated resources (MDN, NPTEL, RFCs, official docs), and practical coding exercises.
• **Dynamic Re-planning**: Whenever you retake a diagnostic or pass a GitHub project verification, the roadmap automatically adapts in real-time.`,
    actions: [
      { label: 'View Sample Roadmap', route: '/roadmap', primary: true },
      { label: 'Sign Up to Generate Mine', route: '/signup' }
    ]
  },
  {
    id: 'project-lab',
    shortTitle: 'Project Lab',
    tag: 'Hands-on Proof',
    question: 'How does the Project Lab and GitHub code verification work?',
    icon: 'GitPullRequest',
    badge: 'Code Verification',
    answer: `Multiple-choice tests prove memory; the **Project Lab proves engineering execution**:

• **Submit Real Repositories**: Connect your public GitHub repositories implementing specific milestone briefs (e.g. Rate Limiters, RESTful microservices, Redis caching layers).
• **Automated Rubric Evaluation**: Our background worker checks code structure, test suite coverage, edge-case resilience, and security best practices against industry standards.
• **Verified Portfolio Proof**: Passing builds verify competencies on your Skill Graph and generate shareable proof for your resume and LinkedIn.`,
    actions: [
      { label: 'Go to Project Lab', route: '/projects', primary: true },
      { label: 'Read Project Specs', anchor: '#projects' }
    ]
  },
  {
    id: 'career-match',
    shortTitle: 'Career Match',
    tag: 'Hiring Benchmarks',
    question: 'How does Career Match Scoring connect me with real tech jobs?',
    icon: 'Briefcase',
    badge: 'Job Readiness',
    answer: `Your verified ability is directly mapped against real engineering role benchmarks across Indian startups and global product companies:

• **Real-Time Match Score**: See your percentage readiness for roles like *Junior Backend Developer*, *API Platform Engineer*, and *Distributed Systems Specialist*.
• **Actionable Gap Analysis**: Clearly identifies the exact missing skills standing between you and interview shortlists.
• **Targeted Sprints**: octoByte automatically adds missing high-weight job skills to the top of your roadmap.`,
    actions: [
      { label: 'Explore Career Hub', route: '/career', primary: true },
      { label: 'Start Free Account', route: '/signup' }
    ]
  },
  {
    id: 'getting-started',
    shortTitle: 'Get Started',
    tag: 'Free for Learners',
    question: 'Is octoByte free to use and how do I get started right now?',
    icon: 'CheckCircle2',
    badge: 'Quick Onboarding',
    answer: `**Yes, octoByte is 100% free for learners and students!**

Here is how you can get started in 3 simple steps:
1. **Create an account** (takes 30 seconds via email or Google).
2. **Take the 4-minute diagnostic CAT** to establish your baseline ability without guesswork.
3. **Receive your interactive Skill Graph and personalized roadmap** immediately!

No credit card required. Built by Team Unix at LNCT Bhopal for the EPAM CoE programme.`,
    actions: [
      { label: 'Create Free Account', route: '/signup', primary: true },
      { label: 'Sign In Existing Account', route: '/login' }
    ]
  }
];

export const INTENT_KEYWORDS = [
  {
    keywords: ['cat', 'adaptive', 'test', 'diagnostic', 'irt', 'questions', 'score', 'theta', 'exam'],
    questionId: 'cat-assessment'
  },
  {
    keywords: ['graph', 'dag', 'skill', 'cluster', 'prerequisite', 'mastered', 'visual', 'node'],
    questionId: 'skill-graph'
  },
  {
    keywords: ['roadmap', 'curriculum', 'plan', 'milestone', 'learn', 'pathway', 'syllabus'],
    questionId: 'ai-roadmap'
  },
  {
    keywords: ['project', 'github', 'repo', 'verification', 'verify', 'code', 'lab', 'rubric'],
    questionId: 'project-lab'
  },
  {
    keywords: ['job', 'career', 'match', 'salary', 'hiring', 'interview', 'company', 'startup', 'placement'],
    questionId: 'career-match'
  },
  {
    keywords: ['free', 'cost', 'pricing', 'start', 'begin', 'signup', 'register', 'account', 'login', 'onboard'],
    questionId: 'getting-started'
  },
  {
    keywords: ['who', 'team', 'lnct', 'epam', 'unix', 'bhopal', 'author', 'creators', 'made'],
    customResponse: {
      answer: `**octoByte** is developed by **Team Unix** (12 members) from the **Lakshmi Narain College of Technology (LNCT), Bhopal**, built specifically for the **EPAM Systems Center of Excellence (CoE)** programme under the mentorship of industry architects.`,
      actions: [
        { label: 'Learn More About Us', anchor: '#how', primary: true }
      ]
    }
  },
  {
    keywords: ['hi', 'hello', 'hey', 'greetings', 'help', 'octo', 'sup'],
    customResponse: {
      answer: `Hello! 👋 I'm **Octo**, your friendly AI upskilling companion on octoByte.

I can explain how our adaptive diagnostic works, walk you through the skill graph, describe personalized roadmaps, project verification, and career matching.

Pick any of the assigned questions below or type your question anytime!`,
      actions: []
    }
  }
];

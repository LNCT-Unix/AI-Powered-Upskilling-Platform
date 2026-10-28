package com.unix.aiupskilling.assessment.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unix.aiupskilling.assessment.model.entity.AssessmentItem;
import com.unix.aiupskilling.assessment.model.entity.Skill;
import com.unix.aiupskilling.assessment.model.entity.Track;
import com.unix.aiupskilling.assessment.repository.AssessmentItemRepository;
import com.unix.aiupskilling.assessment.repository.SkillRepository;
import com.unix.aiupskilling.assessment.repository.TrackRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
public class AssessmentDataLoader implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AssessmentDataLoader.class);

    // Fixed UUID so frontend, tests, and API clients can reliably refer to the Backend track
    public static final UUID BACKEND_TRACK_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String SEED_PATH = "seed/backend-skills.yaml";

    private final TrackRepository trackRepo;
    private final SkillRepository skillRepo;
    private final AssessmentItemRepository itemRepo;
    private final ObjectMapper mapper;

    public AssessmentDataLoader(TrackRepository trackRepo,
                                SkillRepository skillRepo,
                                AssessmentItemRepository itemRepo,
                                ObjectMapper mapper) {
        this.trackRepo = trackRepo;
        this.skillRepo = skillRepo;
        this.itemRepo = itemRepo;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    public void run(ApplicationArguments args) throws Exception {
        boolean trackExists = trackRepo.existsById(BACKEND_TRACK_ID);
        long skillCount = skillRepo.count();
        long itemCount = itemRepo.count();

        ClassPathResource resource = new ClassPathResource(SEED_PATH);
        if (!resource.exists()) {
            log.warn("{} not found on classpath - skipping skill seeding.", SEED_PATH);
            return;
        }

        List<Map<String, Object>> skillsData = readSkillsData(resource);
        if (skillsData == null || skillsData.isEmpty()) {
            log.error("Seed file {} contains no skills - nothing to seed.", SEED_PATH);
            return;
        }

        validateSeedGraph(skillsData);

        if (trackExists && skillCount >= skillsData.size() && itemCount > 0) {
            healPrerequisites(skillsData);
            log.info("Assessment seed data already present ({} skills, {} items). Skipping.", skillCount, itemCount);
            return;
        }

        log.info("Loading Backend Engineering track and skills from {}", SEED_PATH);

        // 1. Seed Track
        Track track = new Track(BACKEND_TRACK_ID, "backend-engineering", "Backend Engineering", "ACTIVE");
        trackRepo.save(track);

        // 2. Load YAML and seed all Skills + DAG Prerequisites
        Map<String, UUID> slugToId = slugToIdMap(skillsData);

        // Build Skill entities
        List<Skill> skills = new ArrayList<>();
        for (Map<String, Object> s : skillsData) {
            skills.add(toSkillEntity(s, slugToId));
        }

        skillRepo.saveAll(skills);
        log.info("Successfully seeded {} skills for track {}.", skills.size(), BACKEND_TRACK_ID);

        // 3. Seed Assessment Question Pool if empty
        if (itemRepo.count() == 0) {
            log.info("Seeding initial question pool for track {}...", BACKEND_TRACK_ID);

            // -2.0 to -1.0: Foundations
            seedQuestion(BACKEND_TRACK_ID, -2.0,
                    "In Git, which command creates and switches to a new branch in a single step?",
                    List.of("git branch <name>", "git checkout -b <name>", "git merge <name>", "git commit -b <name>"),
                    1, "git-basics");

            seedQuestion(BACKEND_TRACK_ID, -1.8,
                    "Which Linux command is used to display current running processes with CPU and memory usage?",
                    List.of("ls", "top", "chmod", "curl"),
                    1, "linux-cli-basics");

            seedQuestion(BACKEND_TRACK_ID, -1.5,
                    "Which HTTP status code category represents client-side errors?",
                    List.of("2xx", "3xx", "4xx", "5xx"),
                    2, "http-basics");

            seedQuestion(BACKEND_TRACK_ID, -1.3,
                    "Which SQL clause is used to filter records before any grouping occurs?",
                    List.of("HAVING", "ORDER BY", "WHERE", "GROUP BY"),
                    2, "sql-basics");

            seedQuestion(BACKEND_TRACK_ID, -1.0,
                    "Which OOP principle emphasizes bundling data and methods that operate on that data while hiding internal states?",
                    List.of("Inheritance", "Encapsulation", "Polymorphism", "Abstraction"),
                    1, "oop-modular-design");

            // -0.8 to -0.1: Early Intermediate
            seedQuestion(BACKEND_TRACK_ID, -0.8,
                    "What is the average time complexity of looking up a key in a standard hash table?",
                    List.of("O(1)", "O(n)", "O(log n)", "O(n^2)"),
                    0, "core-data-structures");

            seedQuestion(BACKEND_TRACK_ID, -0.6,
                    "What is the primary purpose of unit testing?",
                    List.of("Testing the entire system end-to-end", "Validating individual components or functions in isolation", "Measuring server load capacity", "Testing third-party API integration"),
                    1, "unit-testing");

            seedQuestion(BACKEND_TRACK_ID, -0.5,
                    "Which HTTP method is designed to be idempotent and used to replace an existing resource?",
                    List.of("POST", "PUT", "PATCH", "CONNECT"),
                    1, "rest-api-design");

            seedQuestion(BACKEND_TRACK_ID, -0.3,
                    "In SQL, which type of JOIN returns all records from the left table and matched records from the right table?",
                    List.of("INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"),
                    1, "sql-joins-aggregation");

            seedQuestion(BACKEND_TRACK_ID, -0.2,
                    "Why should passwords never be stored using simple MD5 or SHA-256 without a salt and work factor?",
                    List.of("They are too slow for login systems", "They are susceptible to rainbow table lookups and brute-force GPU attacks", "They produce hashes with varying lengths", "They cannot be decoded back into plain text"),
                    1, "password-hashing");

            // 0.0 to 0.5: Core Intermediate
            seedQuestion(BACKEND_TRACK_ID, 0.0,
                    "In RESTful architecture, which HTTP status code represents successful resource creation?",
                    List.of("200 OK", "201 Created", "202 Accepted", "204 No Content"),
                    1, "rest-api-design");

            seedQuestion(BACKEND_TRACK_ID, 0.2,
                    "What does ACID stand for in relational database transaction management?",
                    List.of("Atomicity, Consistency, Isolation, Durability", "Action, Commit, Integrity, Data", "Access, Control, Indexing, Distribution", "Asynchronous, Concurrent, Isolated, Durable"),
                    0, "transactions-acid");

            seedQuestion(BACKEND_TRACK_ID, 0.3,
                    "In a JWT (JSON Web Token), which part contains the claims such as user ID, roles, and expiration time?",
                    List.of("Header", "Payload", "Signature", "Footer"),
                    1, "jwt-auth");

            seedQuestion(BACKEND_TRACK_ID, 0.4,
                    "What problem does a database index primarily solve?",
                    List.of("Reduces disk storage space", "Speeds up data retrieval at the cost of additional write overhead", "Encrypts sensitive column values", "Enforces foreign key relationships"),
                    1, "indexing-query-performance");

            seedQuestion(BACKEND_TRACK_ID, 0.5,
                    "What is a race condition in concurrent software systems?",
                    List.of("When two threads run on different CPU cores simultaneously without issue", "When the outcome depends on the non-deterministic timing or interleaving of multiple execution paths", "When a database transaction completes faster than expected", "When a thread enters an infinite loop waiting for network input"),
                    1, "concurrency-basics");

            // 0.6 to 1.0: Upper Intermediate
            seedQuestion(BACKEND_TRACK_ID, 0.6,
                    "What is the Cache-Aside pattern in backend performance engineering?",
                    List.of("The cache automatically writes through to the database on every update", "The application checks the cache first, loads from the database on a miss, and writes to the cache", "All requests bypass the application layer directly to Redis", "Database logs are copied asynchronously to the cache"),
                    1, "caching-basics");

            seedQuestion(BACKEND_TRACK_ID, 0.7,
                    "In database transactions, which ACID property guarantees that all operations within a transaction succeed or none are applied?",
                    List.of("Atomicity", "Consistency", "Isolation", "Durability"),
                    0, "transactions-acid");

            seedQuestion(BACKEND_TRACK_ID, 0.8,
                    "Which HTTP response header helps defend web applications against Cross-Site Scripting (XSS) by restricting where scripts can load from?",
                    List.of("Content-Security-Policy", "Access-Control-Allow-Origin", "Cache-Control", "X-Forwarded-For"),
                    0, "web-security-owasp");

            seedQuestion(BACKEND_TRACK_ID, 0.9,
                    "Why are background job queues (e.g. Celery, Bull, RabbitMQ) used for tasks like sending emails or processing images?",
                    List.of("They make web servers communicate via UDP instead of TCP", "They prevent long-running tasks from blocking the HTTP request-response cycle", "They eliminate the need for persistent databases", "They automatically compress static web assets"),
                    1, "background-jobs");

            seedQuestion(BACKEND_TRACK_ID, 1.0,
                    "What is the fundamental difference between WebSockets and standard HTTP request-response communication?",
                    List.of("WebSockets do not support encryption", "WebSockets establish a persistent, full-duplex bidirectional TCP connection", "WebSockets are only supported in mobile browsers", "HTTP requires UDP while WebSockets use TCP"),
                    1, "realtime-communication");

            // 1.1 to 2.2: Advanced
            seedQuestion(BACKEND_TRACK_ID, 1.1,
                    "In message queuing, what does 'at-least-once delivery' guarantee require consumers to implement?",
                    List.of("Pessimistic table locking", "Idempotency handling to guard against duplicate messages", "Immediate synchronous commit to replicas", "Strict single-threaded FIFO processing"),
                    1, "message-queues");

            seedQuestion(BACKEND_TRACK_ID, 1.2,
                    "In OAuth 2.0 authorization code grant flow, what is the purpose of the 'state' parameter?",
                    List.of("To store the user's password securely", "To prevent Cross-Site Request Forgery (CSRF) attacks during callback", "To specify the database table for user records", "To set the token expiration TTL"),
                    1, "oauth2-oidc");

            seedQuestion(BACKEND_TRACK_ID, 1.4,
                    "What makes an HTTP endpoint idempotent according to REST architectural principles?",
                    List.of("It returns the exact same timestamp on every call", "Making the same request multiple times produces the same server state as making it once", "It requires no authorization headers", "It processes requests asynchronously"),
                    1, "idempotency-retries");

            seedQuestion(BACKEND_TRACK_ID, 1.5,
                    "Which database isolation level prevents dirty reads, non-repeatable reads, and phantom reads?",
                    List.of("Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"),
                    3, "isolation-concurrency");

            seedQuestion(BACKEND_TRACK_ID, 1.8,
                    "In database scaling, what is the key difference between read replication and horizontal sharding?",
                    List.of("Replication divides rows across databases by key; sharding copies the entire database to replicas", "Replication copies all data to read-only nodes; sharding partitions subsets of data across multiple database nodes", "Replication requires NoSQL; sharding only works with SQL", "There is no difference; they are synonyms"),
                    1, "replication-sharding");

            seedQuestion(BACKEND_TRACK_ID, 2.0,
                    "In high-scale system design, what does the CAP theorem state when a network partition occurs?",
                    List.of("The system must choose between Consistency and Availability", "The system will automatically scale horizontally", "Performance improves due to partitioned parallelism", "Transactions always degrade to Read Uncommitted"),
                    0, "system-design-scalability");

            seedQuestion(BACKEND_TRACK_ID, 2.2,
                    "In distributed systems implementing eventual consistency across multiple microservices, what pattern is commonly used to manage multi-step distributed transactions without 2-phase commit?",
                    List.of("Saga Pattern (choreography or orchestration)", "Singleton Pattern", "Active Record Pattern", "Decorator Pattern"),
                    0, "distributed-consistency");

            log.info("Question pool initialized with {} items.", itemRepo.count());
        }
    }

    private void seedQuestion(UUID trackId, double difficulty, String stem, List<String> options,
                              int correctOption, String skillSlug) throws Exception {
        AssessmentItem item = new AssessmentItem(
                UUID.randomUUID(),
                trackId,
                difficulty,
                stem,
                mapper.writeValueAsString(options),
                correctOption,
                "ACTIVE",
                skillSlug
        );
        itemRepo.save(item);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> readSkillsData(ClassPathResource resource) throws Exception {
        try (InputStream in = resource.getInputStream()) {
            Map<String, Object> yamlDoc = new Yaml().load(in);
            Object raw = yamlDoc == null ? null : yamlDoc.get("skills");
            return (raw instanceof List) ? (List<Map<String, Object>>) raw : null;
        }
    }

    private Map<String, UUID> slugToIdMap(List<Map<String, Object>> skillsData) {
        Map<String, UUID> slugToId = new HashMap<>();
        for (Map<String, Object> s : skillsData) {
            String slug = (String) s.get("slug");
            if (slug == null || slug.isBlank()) continue;
            slugToId.put(slug, UUID.nameUUIDFromBytes(("backend-skill:" + slug).getBytes(StandardCharsets.UTF_8)));
        }
        return slugToId;
    }

    @SuppressWarnings("unchecked")
    private Skill toSkillEntity(Map<String, Object> s, Map<String, UUID> slugToId) {
        String slug = (String) s.get("slug");
        String name = (String) s.get("name");
        String cluster = (String) s.get("cluster");
        Number diffNum = (Number) s.get("difficulty");
        double difficulty = diffNum != null ? diffNum.doubleValue() : 0.0;
        return new Skill(
                slugToId.get(slug),
                BACKEND_TRACK_ID,
                slug,
                name,
                cluster,
                difficulty,
                prerequisiteIdsFrom((List<String>) s.get("prerequisites"), slugToId));
    }

    private Set<UUID> prerequisiteIdsFrom(List<String> prereqSlugs, Map<String, UUID> slugToId) {
        Set<UUID> prereqIds = new HashSet<>();
        if (prereqSlugs == null) return prereqIds;
        for (String pSlug : prereqSlugs) {
            UUID pId = slugToId.get(pSlug);
            if (pId != null) prereqIds.add(pId);
        }
        return prereqIds;
    }

    /**
     * Validates the seed graph before anything is written: reports unknown prerequisite
     * references and fails hard on dependency cycles (Kahn topological sort).
     */
    @SuppressWarnings("unchecked")
    private void validateSeedGraph(List<Map<String, Object>> skillsData) {
        Map<String, UUID> slugToId = slugToIdMap(skillsData);

        Map<String, Integer> indegree = new HashMap<>();
        Map<String, Set<String>> children = new HashMap<>();
        for (Map<String, Object> s : skillsData) {
            String slug = String.valueOf(s.get("slug"));
            indegree.putIfAbsent(slug, 0);
            List<String> prereqSlugs = (List<String>) s.get("prerequisites");
            if (prereqSlugs == null) continue;
            for (String pSlug : prereqSlugs) {
                if (!slugToId.containsKey(pSlug)) {
                    log.error("Seed skill '{}' references unknown prerequisite '{}'.", slug, pSlug);
                    continue;
                }
                if (pSlug.equals(slug)) {
                    log.error("Seed skill '{}' lists itself as a prerequisite.", slug);
                }
                if (children.computeIfAbsent(pSlug, k -> new HashSet<>()).add(slug)) {
                    indegree.merge(slug, 1, Integer::sum);
                }
            }
        }

        Deque<String> ready = new ArrayDeque<>();
        indegree.forEach((slug, deg) -> {
            if (deg == 0) ready.push(slug);
        });
        int processed = 0;
        while (!ready.isEmpty()) {
            String current = ready.poll();
            processed++;
            for (String child : children.getOrDefault(current, Set.of())) {
                int next = indegree.merge(child, -1, Integer::sum);
                if (next == 0) ready.push(child);
            }
        }

        if (processed < indegree.size()) {
            List<String> stuck = new ArrayList<>();
            indegree.forEach((slug, deg) -> {
                if (deg > 0) stuck.add(slug);
            });
            throw new IllegalStateException(
                    "backend-skills.yaml is not a DAG: prerequisite cycle involving " + stuck + " (" + (indegree.size() - processed) + " skills unresolved)");
        }
        log.info("Seed skill graph validated as a DAG: {} skills, {} prerequisite edges resolved.",
                indegree.size(),
                skillsData.stream().mapToInt(s -> s.get("prerequisites") == null ? 0 : ((List<String>) s.get("prerequisites")).size()).sum());
    }

    /**
     * Re-applies prerequisite links from the YAML to an already seeded database so an
     * older or drifted seed does not leave the graph without its DAG edges.
     */
    private void healPrerequisites(List<Map<String, Object>> skillsData) {
        Map<String, UUID> slugToId = slugToIdMap(skillsData);
        Map<UUID, Set<UUID>> expected = new HashMap<>();
        int expectedEdges = 0;
        for (Map<String, Object> s : skillsData) {
            UUID id = slugToId.get((String) s.get("slug"));
            if (id == null) continue;
            Set<UUID> prereqIds = prerequisiteIdsFrom((List<String>) s.get("prerequisites"), slugToId);
            expected.put(id, prereqIds);
            expectedEdges += prereqIds.size();
        }

        List<Skill> dbSkills = skillRepo.findByTrackIdWithPrerequisites(BACKEND_TRACK_ID);
        List<Skill> toFix = new ArrayList<>();
        for (Skill s : dbSkills) {
            Set<UUID> want = expected.get(s.getId());
            if (want != null && !want.equals(s.getPrerequisites())) {
                s.setPrerequisites(new HashSet<>(want));
                toFix.add(s);
            }
        }

        if (!toFix.isEmpty()) {
            skillRepo.saveAll(toFix);
            log.warn("Re-applied prerequisite edges from YAML to {} of {} seeded skills (expected {} edges total).",
                    toFix.size(), dbSkills.size(), expectedEdges);
        }
    }
}

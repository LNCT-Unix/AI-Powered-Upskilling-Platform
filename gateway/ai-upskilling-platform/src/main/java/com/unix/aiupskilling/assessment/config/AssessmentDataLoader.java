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
        Track track = new Track(BACKEND_TRACK_ID, "ACTIVE");
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
            seedQuestion(BACKEND_TRACK_ID, -0.8,
                    "What is the time complexity of looking up a key in a standard HashMap on average?",
                    List.of("O(1)", "O(n)", "O(log n)", "O(n^2)"), 0);

            seedQuestion(BACKEND_TRACK_ID, -0.5,
                    "Which HTTP method is designed to be idempotent and used to replace an existing resource?",
                    List.of("POST", "PUT", "PATCH", "CONNECT"), 1);

            seedQuestion(BACKEND_TRACK_ID, -0.2,
                    "What is the difference between an Exception and an Error in Java?",
                    List.of("Errors can be caught, Exceptions terminate JVM", "Exceptions can be handled by applications, Errors indicate serious system problems", "They are identical", "Errors are checked at compile time"), 1);

            seedQuestion(BACKEND_TRACK_ID, 0.0,
                    "In RESTful architecture, which HTTP status code represents a successful resource creation?",
                    List.of("200 OK", "201 Created", "202 Accepted", "204 No Content"), 1);

            seedQuestion(BACKEND_TRACK_ID, 0.2,
                    "What does ACID stand for in database transaction management?",
                    List.of("Atomicity, Consistency, Isolation, Durability", "Action, Commit, Integrity, Data", "Access, Control, Indexing, Distribution", "Asynchronous, Concurrent, Isolated, Durable"), 0);

            seedQuestion(BACKEND_TRACK_ID, 0.4,
                    "What problem does a database index primarily solve?",
                    List.of("Reduces disk storage space", "Speeds up data retrieval at the cost of additional write overhead", "Encrypts sensitive column values", "Enforces foreign key relationships"), 1);

            seedQuestion(BACKEND_TRACK_ID, 0.6,
                    "What is the purpose of connection pooling (e.g. HikariCP) in backend services?",
                    List.of("Encrypts network traffic between client and server", "Reuses existing database connections to avoid expensive connection handshakes", "Distributes requests across multiple database read replicas", "Caches HTTP responses in memory"), 1);

            seedQuestion(BACKEND_TRACK_ID, 0.8,
                    "Which HTTP header is used to prevent Cross-Site Scripting (XSS) and control external resource loading?",
                    List.of("Content-Security-Policy", "Access-Control-Allow-Origin", "Cache-Control", "X-Forwarded-For"), 0);

            seedQuestion(BACKEND_TRACK_ID, 1.0,
                    "In distributed systems, what does the CAP theorem state is impossible to simultaneously provide?",
                    List.of("Concurrency, Availability, Performance", "Consistency, Availability, Partition Tolerance", "Control, Authentication, Privacy", "Caching, Asynchrony, Persistence"), 1);

            log.info("Question pool initialized with {} items.", itemRepo.count());
        }
    }

    private void seedQuestion(UUID trackId, double difficulty, String stem, List<String> options, int correctOption) throws Exception {
        AssessmentItem item = new AssessmentItem(
                UUID.randomUUID(),
                trackId,
                difficulty,
                stem,
                mapper.writeValueAsString(options),
                correctOption,
                "ACTIVE"
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

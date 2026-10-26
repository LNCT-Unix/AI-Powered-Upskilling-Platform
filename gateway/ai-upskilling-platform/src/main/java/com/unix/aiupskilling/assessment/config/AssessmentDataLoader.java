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
import java.util.*;

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

        if (trackExists && skillCount >= 56 && itemCount > 0) {
            log.info("Assessment seed data already present ({} skills, {} items). Skipping.", skillCount, itemCount);
            return;
        }

        log.info("Loading Backend Engineering track and skills from {}", SEED_PATH);

        // 1. Seed Track
        Track track = new Track(BACKEND_TRACK_ID, "ACTIVE");
        trackRepo.save(track);

        // 2. Load YAML and seed all 56 Skills + DAG Prerequisites
        ClassPathResource resource = new ClassPathResource(SEED_PATH);
        if (resource.exists()) {
            try (InputStream in = resource.getInputStream()) {
                Map<String, Object> yamlDoc = new Yaml().load(in);
                List<Map<String, Object>> skillsData = (List<Map<String, Object>>) yamlDoc.get("skills");

                if (skillsData != null) {
                    // Map slug -> deterministic UUID
                    Map<String, UUID> slugToId = new HashMap<>();
                    for (Map<String, Object> s : skillsData) {
                        String slug = (String) s.get("slug");
                        UUID skillId = UUID.nameUUIDFromBytes(("backend-skill:" + slug).getBytes(StandardCharsets.UTF_8));
                        slugToId.put(slug, skillId);
                    }

                    // Build Skill entities
                    List<Skill> skills = new ArrayList<>();
                    for (Map<String, Object> s : skillsData) {
                        String slug = (String) s.get("slug");
                        String name = (String) s.get("name");
                        String cluster = (String) s.get("cluster");
                        Number diffNum = (Number) s.get("difficulty");
                        double difficulty = diffNum != null ? diffNum.doubleValue() : 0.0;

                        List<String> prereqSlugs = (List<String>) s.get("prerequisites");
                        Set<UUID> prereqIds = new HashSet<>();
                        if (prereqSlugs != null) {
                            for (String pSlug : prereqSlugs) {
                                UUID pId = slugToId.get(pSlug);
                                if (pId != null) {
                                    prereqIds.add(pId);
                                }
                            }
                        }

                        UUID skillId = slugToId.get(slug);
                        Skill skill = new Skill(skillId, BACKEND_TRACK_ID, name, cluster, difficulty, prereqIds);
                        skills.add(skill);
                    }

                    skillRepo.saveAll(skills);
                    log.info("Successfully seeded {} skills for track {}.", skills.size(), BACKEND_TRACK_ID);
                }
            }
        }

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
}

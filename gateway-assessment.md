# Gateway Assessment - Extracted Code and Documentation

## File: INTEGRATION.md

```markdown
# Sprint 1 assessment module: integration notes

Prepared for Team Unix. Maintainer: Dev Sharma.

## What is in this folder

| Path | What it is | Status |
|---|---|---|
| `assessment/engine/*` | The adaptive test engine: IRT math, EAP estimate, question selection, stop rule, skill mapper, level mapper, simulation | Compiled and run here (plain Java, no Spring) |
| `assessment/AssessmentService.java` | Start, resume, answer, finish, result. Rebuilds state from saved answers on every call | Written, not compiled here |
| `assessment/AssessmentController.java`, `AssessmentDtos.java` | The four `/api/v1/assessments` endpoints | Written, not compiled here |
| `assessment/SkillGraphLoader.java` | Loads the skill YAML into the database on startup, validates the DAG | Written, not compiled here |
| `assessment/AssessmentProperties.java` | Settings from `application.yml` | Written, not compiled here |
| `resources/seed/backend-skills.yaml` | The 56-skill backend graph | Validated (no cycles) |
| `simulation-output.txt` | Output of 1,000 simulated learners | Real output |

Everything outside `engine/` was written without a Spring build available, so expect to fix small compile errors on first build.

## Requirements

- Spring Boot 3.2 or newer (the service uses `JdbcClient`), Java 17 or newer.
- Dependencies: web, security, jdbc, validation, PostgreSQL driver, Flyway. SnakeYAML and Jackson come with the starters.
- Add `@ConfigurationPropertiesScan` to the main application class.
- The JWT subject must be the user id (UUID), because the controller reads it with `auth.getName()`.

## application.yml

```yaml
assessment:
  min-items: 5
  max-items: 9
  se-threshold: 0.45
  mastery-margin: 0.25
  beginner-below: -0.5
  advanced-above: 0.75
```

## Database

The code uses the column names from the API and database reference PDF. The earlier `V1__init.sql` is older and is missing some columns the code needs (for example `tracks.status`, `assessment_items.cluster`, `assessment_items.times_answered`, `assessments.level`, `assessments.correct_count`). Use the schema from the PDF for your migration.

## Decisions worth knowing

- **SE threshold is 0.45, not 0.35.** In simulation, a 0.35 threshold is never reached within 9 questions (everyone takes all 9, average SE 0.41). At 0.45 the test averages 7.4 questions and 79% of learners stop early.
- **No exposure cap yet.** Selection depends only on the question pool and the learner's answers, so replays are exact. Exposure counts are still recorded for later analysis.
- **Do not edit questions or activate and retire them while tests are running.** The server checks that each submitted question is the one the engine would serve next, so a changing pool can reject an in-flight answer with a 409.
- **StrictMath is used on purpose** so results are bit-identical on every machine.

## Still to do

1. Write `items.yaml` (the question bank) and an item loader that follows the same pattern as `SkillGraphLoader`.
2. JUnit tests for the engine with fixed answer sequences, and API tests for the full flow.
3. The `GET /assessments` history endpoint and the dashboard endpoint.

```

## File: simulation-output.txt

`$lang
Stop rule: min 5, max 9, SE threshold 0.45
Learners simulated:          1000
Average questions asked:     7.37
Maximum questions asked:     9
Stopped on SE threshold:     79.4%
Stopped on max questions:    20.6%
Average final SE:            0.441
RMSE (estimate vs true):     0.420
Correlation est vs true:     0.909
Test-retest correlation:     0.828
95% interval coverage:       95.2%
Replay gives identical result: true

```

## File: src\main\java\com\teamunix\gateway\assessment\AssessmentController.java

`$lang
package com.teamunix.gateway.assessment;

import com.teamunix.gateway.assessment.AssessmentDtos.*;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** The JWT subject must be the user id (UUID). */
@RestController
@RequestMapping("/api/v1/assessments")
public class AssessmentController {
    private final AssessmentService service;

    public AssessmentController(AssessmentService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AssessmentState start(Authentication auth, @Valid @RequestBody StartRequest req) {
        return service.start(userId(auth), req.trackId());
    }

    @GetMapping("/{id}")
    public AssessmentState get(Authentication auth, @PathVariable UUID id) {
        return service.state(userId(auth), id);
    }

    @PostMapping("/{id}/responses")
    public AssessmentState answer(Authentication auth, @PathVariable UUID id, @Valid @RequestBody AnswerRequest req) {
        return service.answer(userId(auth), id, req.itemId(), req.selectedOption());
    }

    @GetMapping("/{id}/result")
    public ResultView result(Authentication auth, @PathVariable UUID id) {
        return service.result(userId(auth), id);
    }

    private static UUID userId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}

```

## File: src\main\java\com\teamunix\gateway\assessment\AssessmentDtos.java

`$lang
package com.teamunix.gateway.assessment;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

/** Request and response shapes. Questions never carry the correct answer or IRT values. */
public final class AssessmentDtos {
    private AssessmentDtos() {}

    public record StartRequest(@NotNull UUID trackId) {}

    public record AnswerRequest(@NotNull UUID itemId, @NotNull Integer selectedOption) {}

    public record Question(UUID itemId, String stem, List<String> options) {}

    public record Progress(int answered, int max) {}

    public record AssessmentState(UUID assessmentId, String status, boolean done,
                                  Question question, Progress progress) {}

    public record SkillResult(UUID skillId, String name, String cluster, String state) {}

    public record ResultView(UUID assessmentId, String level, double theta, double se,
                             double ciLow, double ciHigh, int answered, List<SkillResult> skills) {}
}

```

## File: src\main\java\com\teamunix\gateway\assessment\AssessmentProperties.java

`$lang
package com.teamunix.gateway.assessment;

import com.teamunix.gateway.assessment.engine.CatConfig;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Bound from the "assessment" block in application.yml. */
@ConfigurationProperties(prefix = "assessment")
public record AssessmentProperties(int minItems, int maxItems, double seThreshold,
                                   double masteryMargin, double beginnerBelow, double advancedAbove) {

    public CatConfig toCatConfig() {
        CatConfig d = CatConfig.defaults();
        return new CatConfig(minItems, maxItems, seThreshold,
                d.gridPoints(), d.gridMin(), d.gridMax(), d.priorMean(), d.priorSd());
    }
}

```

## File: src\main\java\com\teamunix\gateway\assessment\AssessmentService.java

`$lang
package com.teamunix.gateway.assessment;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamunix.gateway.assessment.AssessmentDtos.*;
import com.teamunix.gateway.assessment.engine.*;
import com.teamunix.gateway.assessment.engine.SkillMapper.SkillNode;
import com.teamunix.gateway.assessment.engine.SkillMapper.SkillState;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Runs the adaptive test. Nothing is kept in memory between requests: every call rebuilds
 * the state from the saved answers, using the engine settings frozen when the test started.
 */
@Service
public class AssessmentService {
    private static final String ENGINE_VERSION = "cat-1.0";

    private final JdbcClient jdbc;
    private final AssessmentProperties props;
    private final ObjectMapper mapper;
    private final SkillMapper skillMapper = new SkillMapper();

    public AssessmentService(JdbcClient jdbc, AssessmentProperties props, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.props = props;
        this.mapper = mapper;
    }

    // ---------- row shapes (snake_case columns map to these automatically) ----------
    record AssessmentRow(UUID id, UUID userId, UUID trackId, String status, String config, int itemsAdministered) {}
    record ItemRow(UUID id, String cluster, double irtA, double irtB, double irtC,
                   String stem, String options, int correctOption) {}
    record AnsweredRow(UUID id, String cluster, double irtA, double irtB, double irtC, boolean correct) {}

    // ---------- start ----------
    @Transactional
    public AssessmentState start(UUID userId, UUID trackId) {
        String status = jdbc.sql("SELECT status FROM tracks WHERE id = :t").param("t", trackId)
                .query(String.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Track not found"));
        if (!"ACTIVE".equals(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Track is not available yet");
        }
        Optional<UUID> existing = findInProgress(userId, trackId);
        if (existing.isPresent()) return state(userId, existing.get());

        try {
            UUID id = jdbc.sql("""
                    INSERT INTO assessments (user_id, track_id, status, engine_version, config)
                    VALUES (:u, :t, 'IN_PROGRESS', :v, CAST(:cfg AS jsonb)) RETURNING id""")
                    .param("u", userId).param("t", trackId).param("v", ENGINE_VERSION)
                    .param("cfg", toJson(props.toCatConfig()))
                    .query(UUID.class).single();
            return state(userId, id);
        } catch (DuplicateKeyException e) {      // two start requests at once
            return state(userId, findInProgress(userId, trackId).orElseThrow());
        }
    }

    private Optional<UUID> findInProgress(UUID userId, UUID trackId) {
        return jdbc.sql("SELECT id FROM assessments WHERE user_id = :u AND track_id = :t AND status = 'IN_PROGRESS'")
                .param("u", userId).param("t", trackId).query(UUID.class).optional();
    }

    // ---------- current state (also used to resume) ----------
    @Transactional(readOnly = true)
    public AssessmentState state(UUID userId, UUID assessmentId) {
        AssessmentRow a = loadOwned(userId, assessmentId, false);
        CatConfig cfg = parseConfig(a.config());
        if (!"IN_PROGRESS".equals(a.status())) {
            return new AssessmentState(a.id(), a.status(), true, null, new Progress(a.itemsAdministered(), cfg.maxItems()));
        }
        CatEngine engine = new CatEngine(cfg);
        List<Response> answered = loadResponses(a.id());
        Estimate est = engine.estimate(answered);
        Item next = engine.nextItem(answered, loadPool(a.trackId()), est)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "No questions available"));
        return new AssessmentState(a.id(), a.status(), false, toQuestion(next.id()),
                new Progress(answered.size(), cfg.maxItems()));
    }

    // ---------- submit an answer ----------
    @Transactional
    public AssessmentState answer(UUID userId, UUID assessmentId, UUID itemId, int selectedOption) {
        AssessmentRow a = loadOwned(userId, assessmentId, true);          // row lock: no double submits
        if (!"IN_PROGRESS".equals(a.status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assessment already finished");
        }
        CatConfig cfg = parseConfig(a.config());
        CatEngine engine = new CatEngine(cfg);
        List<Item> pool = loadPool(a.trackId());
        List<Response> answered = loadResponses(a.id());

        // The submitted question must be exactly the one the engine would serve next.
        Estimate before = engine.estimate(answered);
        Item expected = engine.nextItem(answered, pool, before).orElse(null);
        if (expected == null || !expected.id().equals(itemId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That is not the current question");
        }

        ItemRow row = loadItem(itemId);
        List<String> options = parseOptions(row.options());
        if (selectedOption < 0 || selectedOption >= options.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid option");
        }
        boolean correct = selectedOption == row.correctOption();

        List<Response> updated = new ArrayList<>(answered);
        updated.add(new Response(expected, correct));
        Estimate after = engine.estimate(updated);

        jdbc.sql("""
                INSERT INTO assessment_responses
                    (assessment_id, seq, item_id, selected_option, is_correct, theta_after, se_after)
                VALUES (:a, :seq, :i, :o, :c, :th, :se)""")
                .param("a", a.id()).param("seq", updated.size()).param("i", itemId)
                .param("o", selectedOption).param("c", correct)
                .param("th", after.theta()).param("se", after.se()).update();
        jdbc.sql("""
                UPDATE assessment_items SET exposure_count = exposure_count + 1,
                    times_answered = times_answered + 1,
                    times_correct = times_correct + :inc WHERE id = :i""")
                .param("inc", correct ? 1 : 0).param("i", itemId).update();

        Optional<Item> next = engine.nextItem(updated, pool, after);
        Optional<StopReason> stop = engine.stopReason(after, updated.size(), next.isPresent());
        int correctCount = (int) updated.stream().filter(Response::correct).count();

        if (stop.isEmpty()) {
            jdbc.sql("""
                    UPDATE assessments SET items_administered = :n, correct_count = :c,
                        last_activity_at = now() WHERE id = :a""")
                    .param("n", updated.size()).param("c", correctCount).param("a", a.id()).update();
            return new AssessmentState(a.id(), "IN_PROGRESS", false, toQuestion(next.get().id()),
                    new Progress(updated.size(), cfg.maxItems()));
        }
        finish(a, after, updated.size(), correctCount, stop.get());
        return new AssessmentState(a.id(), "COMPLETED", true, null, new Progress(updated.size(), cfg.maxItems()));
    }

    private void finish(AssessmentRow a, Estimate est, int answered, int correctCount, StopReason reason) {
        Level level = Level.of(est.theta(), props.beginnerBelow(), props.advancedAbove());
        jdbc.sql("""
                UPDATE assessments SET status = 'COMPLETED', theta = :th, theta_se = :se,
                    ci_low = :lo, ci_high = :hi, level = :lvl, items_administered = :n,
                    correct_count = :c, stop_reason = :r, last_activity_at = now(), completed_at = now()
                WHERE id = :a""")
                .param("th", est.theta()).param("se", est.se()).param("lo", est.ciLow())
                .param("hi", est.ciHigh()).param("lvl", level.name()).param("n", answered)
                .param("c", correctCount).param("r", reason.name()).param("a", a.id()).update();

        List<SkillNode> nodes = loadSkillNodes(a.trackId());
        Map<UUID, SkillState> states = skillMapper.map(est.theta(), nodes, props.masteryMargin());
        for (Map.Entry<UUID, SkillState> e : states.entrySet()) {
            jdbc.sql("INSERT INTO assessment_skill_results (assessment_id, skill_id, state) VALUES (:a, :s, :st)")
                    .param("a", a.id()).param("s", e.getKey()).param("st", e.getValue().name()).update();
        }
    }

    // ---------- result ----------
    @Transactional(readOnly = true)
    public ResultView result(UUID userId, UUID assessmentId) {
        record Head(String status, String level, double theta, double thetaSe,
                    double ciLow, double ciHigh, int itemsAdministered) {}
        loadOwned(userId, assessmentId, false);
        Head h = jdbc.sql("""
                SELECT status, level, COALESCE(theta,0) AS theta, COALESCE(theta_se,0) AS theta_se,
                       COALESCE(ci_low,0) AS ci_low, COALESCE(ci_high,0) AS ci_high, items_administered
                FROM assessments WHERE id = :a""").param("a", assessmentId).query(Head.class).single();
        if (!"COMPLETED".equals(h.status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assessment not finished yet");
        }
        List<SkillResult> skills = jdbc.sql("""
                SELECT s.id AS skill_id, s.name, s.cluster, r.state
                FROM assessment_skill_results r JOIN skills s ON s.id = r.skill_id
                WHERE r.assessment_id = :a ORDER BY s.cluster, s.difficulty""")
                .param("a", assessmentId).query(SkillResult.class).list();
        return new ResultView(assessmentId, h.level(), h.theta(), h.thetaSe(), h.ciLow(), h.ciHigh(),
                h.itemsAdministered(), skills);
    }

    // ---------- data access helpers ----------
    private AssessmentRow loadOwned(UUID userId, UUID id, boolean lock) {
        String sql = "SELECT id, user_id, track_id, status, config::text AS config, items_administered "
                + "FROM assessments WHERE id = :id AND user_id = :u" + (lock ? " FOR UPDATE" : "");
        return jdbc.sql(sql).param("id", id).param("u", userId).query(AssessmentRow.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));
    }

    private List<Item> loadPool(UUID trackId) {
        return jdbc.sql("SELECT id, cluster, irt_a, irt_b, irt_c FROM assessment_items WHERE track_id = :t AND status = 'ACTIVE'")
                .param("t", trackId)
                .query((rs, i) -> new Item((UUID) rs.getObject("id"), rs.getString("cluster"),
                        rs.getDouble("irt_a"), rs.getDouble("irt_b"), rs.getDouble("irt_c")))
                .list();
    }

    private List<Response> loadResponses(UUID assessmentId) {
        return jdbc.sql("""
                SELECT i.id, i.cluster, i.irt_a, i.irt_b, i.irt_c, r.is_correct AS correct
                FROM assessment_responses r JOIN assessment_items i ON i.id = r.item_id
                WHERE r.assessment_id = :a ORDER BY r.seq""")
                .param("a", assessmentId).query(AnsweredRow.class).list().stream()
                .map(r -> new Response(new Item(r.id(), r.cluster(), r.irtA(), r.irtB(), r.irtC()), r.correct()))
                .toList();
    }

    private ItemRow loadItem(UUID id) {
        return jdbc.sql("SELECT id, cluster, irt_a, irt_b, irt_c, stem, options::text AS options, correct_option FROM assessment_items WHERE id = :i")
                .param("i", id).query(ItemRow.class).single();
    }

    private Question toQuestion(UUID itemId) {
        ItemRow row = loadItem(itemId);
        return new Question(row.id(), row.stem(), parseOptions(row.options()));
    }

    private List<SkillNode> loadSkillNodes(UUID trackId) {
        Map<UUID, List<UUID>> prereqs = new HashMap<>();
        jdbc.sql("""
                SELECT sp.skill_id, sp.prerequisite_id FROM skill_prerequisites sp
                JOIN skills s ON s.id = sp.skill_id WHERE s.track_id = :t""")
                .param("t", trackId)
                .query((rs, i) -> {
                    prereqs.computeIfAbsent((UUID) rs.getObject("skill_id"), k -> new ArrayList<>())
                            .add((UUID) rs.getObject("prerequisite_id"));
                    return null;
                }).list();
        return jdbc.sql("SELECT id, difficulty FROM skills WHERE track_id = :t").param("t", trackId)
                .query((rs, i) -> {
                    UUID id = (UUID) rs.getObject("id");
                    return new SkillNode(id, rs.getDouble("difficulty"), prereqs.getOrDefault(id, List.of()));
                }).list();
    }

    private String toJson(Object o) {
        try { return mapper.writeValueAsString(o); }
        catch (JsonProcessingException e) { throw new IllegalStateException(e); }
    }

    private CatConfig parseConfig(String json) {
        try { return mapper.readValue(json, CatConfig.class); }
        catch (JsonProcessingException e) { throw new IllegalStateException(e); }
    }

    private List<String> parseOptions(String json) {
        try { return mapper.readValue(json, new TypeReference<List<String>>() {}); }
        catch (JsonProcessingException e) { throw new IllegalStateException(e); }
    }
}

```

## File: src\main\java\com\teamunix\gateway\assessment\SkillGraphLoader.java

`$lang
package com.teamunix.gateway.assessment;

import java.io.InputStream;
import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import org.yaml.snakeyaml.Yaml;

/**
 * Loads seed/backend-skills.yaml into tracks, skills and skill_prerequisites on startup.
 * Safe to run on every start: skills are upserted by (track, slug), edges are rebuilt.
 * The file is validated first (unique slugs, known prerequisites, no cycles).
 */
@Component
public class SkillGraphLoader implements ApplicationRunner {
    private static final String SEED = "seed/backend-skills.yaml";

    private final JdbcClient jdbc;
    private final TransactionTemplate tx;

    public SkillGraphLoader(JdbcClient jdbc, TransactionTemplate tx) {
        this.jdbc = jdbc;
        this.tx = tx;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try (InputStream in = new ClassPathResource(SEED).getInputStream()) {
            Map<String, Object> doc = new Yaml().load(in);
            tx.executeWithoutResult(status -> load(doc));
        }
    }

    @SuppressWarnings("unchecked")
    private void load(Map<String, Object> doc) {
        Map<String, Object> track = (Map<String, Object>) doc.get("track");
        List<Map<String, Object>> skills = (List<Map<String, Object>>) doc.get("skills");
        validate(skills);

        UUID trackId = jdbc.sql("""
                INSERT INTO tracks (slug, name, description, status)
                VALUES (:slug, :name, :description, :status)
                ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name,
                    description = EXCLUDED.description, status = EXCLUDED.status
                RETURNING id""")
                .param("slug", track.get("slug"))
                .param("name", track.get("name"))
                .param("description", track.get("description"))
                .param("status", track.get("status"))
                .query(UUID.class).single();

        for (Map<String, Object> s : skills) {
            jdbc.sql("""
                    INSERT INTO skills (track_id, slug, name, cluster, difficulty, description)
                    VALUES (:track, :slug, :name, :cluster, :difficulty, :description)
                    ON CONFLICT (track_id, slug) DO UPDATE SET name = EXCLUDED.name,
                        cluster = EXCLUDED.cluster, difficulty = EXCLUDED.difficulty,
                        description = EXCLUDED.description""")
                    .param("track", trackId)
                    .param("slug", s.get("slug"))
                    .param("name", s.get("name"))
                    .param("cluster", s.get("cluster"))
                    .param("difficulty", ((Number) s.get("difficulty")).doubleValue())
                    .param("description", s.get("description"))
                    .update();
        }

        Map<String, UUID> ids = new HashMap<>();
        jdbc.sql("SELECT slug, id FROM skills WHERE track_id = :t").param("t", trackId)
                .query((rs, i) -> {
                    ids.put(rs.getString("slug"), (UUID) rs.getObject("id"));
                    return null;
                }).list();

        jdbc.sql("DELETE FROM skill_prerequisites WHERE skill_id IN (SELECT id FROM skills WHERE track_id = :t)")
                .param("t", trackId).update();
        for (Map<String, Object> s : skills) {
            for (String pre : (List<String>) s.get("prerequisites")) {
                jdbc.sql("INSERT INTO skill_prerequisites (skill_id, prerequisite_id) VALUES (:s, :p)")
                        .param("s", ids.get((String) s.get("slug")))
                        .param("p", ids.get(pre))
                        .update();
            }
        }
    }

    /** Rejects duplicate slugs, unknown prerequisites and cycles (Kahn's algorithm). */
    @SuppressWarnings("unchecked")
    private void validate(List<Map<String, Object>> skills) {
        Set<String> slugs = new HashSet<>();
        for (Map<String, Object> s : skills) {
            if (!slugs.add((String) s.get("slug"))) {
                throw new IllegalStateException("Duplicate skill slug: " + s.get("slug"));
            }
        }
        Map<String, Integer> indegree = new HashMap<>();
        Map<String, List<String>> children = new HashMap<>();
        for (Map<String, Object> s : skills) {
            String slug = (String) s.get("slug");
            List<String> pres = (List<String>) s.get("prerequisites");
            indegree.put(slug, pres.size());
            for (String p : pres) {
                if (!slugs.contains(p)) {
                    throw new IllegalStateException("Unknown prerequisite " + p + " for " + slug);
                }
                children.computeIfAbsent(p, k -> new java.util.ArrayList<>()).add(slug);
            }
        }
        ArrayDeque<String> queue = new ArrayDeque<>();
        indegree.forEach((k, v) -> { if (v == 0) queue.add(k); });
        int visited = 0;
        while (!queue.isEmpty()) {
            String n = queue.poll();
            visited++;
            for (String c : children.getOrDefault(n, List.of())) {
                if (indegree.merge(c, -1, Integer::sum) == 0) queue.add(c);
            }
        }
        if (visited != skills.size()) {
            throw new IllegalStateException("Skill graph contains a cycle");
        }
    }
}

```

## File: src\main\java\com\teamunix\gateway\assessment\engine\CatConfig.java

`$lang
package com.teamunix.gateway.assessment.engine;

/** Engine settings. A copy is saved with every assessment so results can be reproduced. */
public record CatConfig(int minItems, int maxItems, double seThreshold,
                        int gridPoints, double gridMin, double gridMax,
                        double priorMean, double priorSd) {

    public static CatConfig defaults() {
        return new CatConfig(5, 9, 0.45, 61, -4.0, 4.0, 0.0, 1.0);
    }
}

```

## File: src\main\java\com\teamunix\gateway\assessment\engine\CatEngine.java

`$lang
package com.teamunix.gateway.assessment.engine;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Computerized adaptive test engine. Pure logic: no database, no Spring, no randomness.
 * Given the same pool and the same answers, every method returns the same result.
 *
 * @author Dev Sharma, Team Unix
 */
public final class CatEngine {
    private final CatConfig cfg;

    public CatEngine(CatConfig cfg) {
        this.cfg = cfg;
    }

    /** EAP (expected a posteriori) ability estimate on a fixed grid. */
    public Estimate estimate(List<Response> responses) {
        int n = cfg.gridPoints();
        double step = (cfg.gridMax() - cfg.gridMin()) / (n - 1);
        double[] theta = new double[n];
        double[] logPost = new double[n];
        double max = Double.NEGATIVE_INFINITY;

        for (int i = 0; i < n; i++) {
            theta[i] = cfg.gridMin() + i * step;
            double z = (theta[i] - cfg.priorMean()) / cfg.priorSd();
            double lp = -0.5 * z * z;
            for (Response r : responses) {
                double p = IrtMath.p(theta[i], r.item());
                lp += StrictMath.log(r.correct() ? p : 1.0 - p);
            }
            logPost[i] = lp;
            if (lp > max) max = lp;
        }

        double[] w = new double[n];
        double sum = 0;
        for (int i = 0; i < n; i++) {
            w[i] = StrictMath.exp(logPost[i] - max);
            sum += w[i];
        }
        double mean = 0;
        for (int i = 0; i < n; i++) {
            w[i] /= sum;
            mean += w[i] * theta[i];
        }
        double var = 0;
        for (int i = 0; i < n; i++) {
            double d = theta[i] - mean;
            var += w[i] * d * d;
        }

        double cum = 0, lo = theta[0], hi = theta[n - 1];
        boolean loSet = false;
        for (int i = 0; i < n; i++) {
            cum += w[i];
            if (!loSet && cum >= 0.025) { lo = theta[i]; loSet = true; }
            if (cum >= 0.975) { hi = theta[i]; break; }
        }
        return new Estimate(mean, StrictMath.sqrt(var), lo, hi);
    }

    /**
     * Next question: highest information at the current ability, discounted for topic
     * clusters already used so the test spreads across topics. Ties go to the smaller id.
     */
    public Optional<Item> nextItem(List<Response> responses, Collection<Item> pool, Estimate est) {
        Set<UUID> used = new HashSet<>();
        Map<String, Integer> clusterUse = new HashMap<>();
        for (Response r : responses) {
            used.add(r.item().id());
            clusterUse.merge(r.item().cluster(), 1, Integer::sum);
        }
        Item best = null;
        double bestScore = -1;
        for (Item it : pool) {
            if (used.contains(it.id())) continue;
            double score = IrtMath.information(est.theta(), it) / (1 + clusterUse.getOrDefault(it.cluster(), 0));
            if (best == null || score > bestScore
                    || (score == bestScore && it.id().compareTo(best.id()) < 0)) {
                best = it;
                bestScore = score;
            }
        }
        return Optional.ofNullable(best);
    }

    /** Empty means keep going. */
    public Optional<StopReason> stopReason(Estimate est, int answered, boolean itemsLeft) {
        if (answered >= cfg.maxItems()) return Optional.of(StopReason.MAX_ITEMS);
        if (!itemsLeft) return Optional.of(StopReason.NO_ITEMS_LEFT);
        if (answered >= cfg.minItems() && est.se() <= cfg.seThreshold()) {
            return Optional.of(StopReason.SE_THRESHOLD);
        }
        return Optional.empty();
    }
}

```

## File: src\main\java\com\teamunix\gateway\assessment\engine\Estimate.java

`$lang
package com.teamunix.gateway.assessment.engine;

/** Ability estimate: theta, its standard error, and a 95% credible interval. */
public record Estimate(double theta, double se, double ciLow, double ciHigh) {}

```

## File: src\main\java\com\teamunix\gateway\assessment\engine\IrtMath.java

`$lang
package com.teamunix.gateway.assessment.engine;

/**
 * 3-parameter logistic model. StrictMath is used on purpose: it gives bit-identical
 * results on every JVM and OS, which the "reproducible" requirement depends on.
 */
final class IrtMath {
    static final double D = 1.702;

    private IrtMath() {}

    /** Probability of a correct answer at ability theta. */
    static double p(double theta, Item it) {
        double z = -D * it.a() * (theta - it.b());
        return it.c() + (1.0 - it.c()) / (1.0 + StrictMath.exp(z));
    }

    /** Fisher information of the item at ability theta. */
    static double information(double theta, Item it) {
        double p = p(theta, it);
        double q = 1.0 - p;
        double num = p - it.c();
        double den = (1.0 - it.c()) * (1.0 - it.c());
        return D * D * it.a() * it.a() * (q / p) * (num * num) / den;
    }
}

```

## File: src\main\java\com\teamunix\gateway\assessment\engine\Item.java

`$lang
package com.teamunix.gateway.assessment.engine;

import java.util.UUID;

/** A question as the engine sees it: only the IRT values and topic cluster. No text, no answer. */
public record Item(UUID id, String cluster, double a, double b, double c) {}

```

## File: src\main\java\com\teamunix\gateway\assessment\engine\Level.java

`$lang
package com.teamunix.gateway.assessment.engine;

public enum Level {
    BEGINNER, INTERMEDIATE, ADVANCED;

    public static Level of(double theta, double beginnerBelow, double advancedAbove) {
        if (theta < beginnerBelow) return BEGINNER;
        if (theta > advancedAbove) return ADVANCED;
        return INTERMEDIATE;
    }
}

```

## File: src\main\java\com\teamunix\gateway\assessment\engine\Response.java

`$lang
package com.teamunix.gateway.assessment.engine;

/** One answered question, in the order it was answered. */
public record Response(Item item, boolean correct) {}

```

## File: src\main\java\com\teamunix\gateway\assessment\engine\Simulation.java

`$lang
package com.teamunix.gateway.assessment.engine;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

/** Runs virtual learners through the engine to prove test length and accuracy. */
public final class Simulation {

    public static void main(String[] args) {
        CatConfig cfg = args.length > 0 ? new CatConfig(5, 9, Double.parseDouble(args[0]), 61, -4, 4, 0, 1) : CatConfig.defaults();
        CatEngine engine = new CatEngine(cfg);
        Random rnd = new Random(42);

        // Synthetic bank: 9 clusters x 9 items, difficulty spread from -2.4 to 2.4
        List<Item> pool = new ArrayList<>();
        for (int c = 0; c < 9; c++) {
            for (int i = 0; i < 9; i++) {
                double b = -2.4 + 4.8 * i / 8.0;
                double a = 0.9 + 0.7 * rnd.nextDouble();
                pool.add(new Item(new UUID(c, i), "cluster-" + c, a, b, 0.2));
            }
        }

        int learners = 1000;
        double[] trueTheta = new double[learners];
        double[] est1 = new double[learners], est2 = new double[learners];
        int sumItems = 0, maxItems = 0, bySe = 0, byMax = 0, covered = 0;
        double sumSe = 0, sqErr = 0;

        for (int k = 0; k < learners; k++) {
            trueTheta[k] = rnd.nextGaussian();
            Run r1 = run(engine, pool, trueTheta[k], rnd);
            Run r2 = run(engine, pool, trueTheta[k], rnd);
            est1[k] = r1.est.theta();
            est2[k] = r2.est.theta();
            sumItems += r1.answered;
            maxItems = Math.max(maxItems, r1.answered);
            if (r1.reason == StopReason.SE_THRESHOLD) bySe++; else byMax++;
            sumSe += r1.est.se();
            double e = r1.est.theta() - trueTheta[k];
            sqErr += e * e;
            if (trueTheta[k] >= r1.est.ciLow() && trueTheta[k] <= r1.est.ciHigh()) covered++;
        }

        System.out.printf("Stop rule: min %d, max %d, SE threshold %.2f%n", cfg.minItems(), cfg.maxItems(), cfg.seThreshold());
        System.out.printf("Learners simulated:          %d%n", learners);
        System.out.printf("Average questions asked:     %.2f%n", sumItems / (double) learners);
        System.out.printf("Maximum questions asked:     %d%n", maxItems);
        System.out.printf("Stopped on SE threshold:     %.1f%%%n", 100.0 * bySe / learners);
        System.out.printf("Stopped on max questions:    %.1f%%%n", 100.0 * byMax / learners);
        System.out.printf("Average final SE:            %.3f%n", sumSe / learners);
        System.out.printf("RMSE (estimate vs true):     %.3f%n", Math.sqrt(sqErr / learners));
        System.out.printf("Correlation est vs true:     %.3f%n", corr(est1, trueTheta));
        System.out.printf("Test-retest correlation:     %.3f%n", corr(est1, est2));
        System.out.printf("95%% interval coverage:       %.1f%%%n", 100.0 * covered / learners);

        // Reproducibility: replay one learner's answers twice, results must be bit-identical
        Run base = run(engine, pool, 0.7, new Random(7));
        Estimate again = engine.estimate(base.responses);
        boolean same = again.theta() == base.est.theta() && again.se() == base.est.se();
        System.out.println("Replay gives identical result: " + same);
    }

    private record Run(Estimate est, int answered, StopReason reason, List<Response> responses) {}

    private static Run run(CatEngine engine, List<Item> pool, double trueTheta, Random rnd) {
        List<Response> rs = new ArrayList<>();
        Estimate est = engine.estimate(rs);
        while (true) {
            var next = engine.nextItem(rs, pool, est);
            var stop = engine.stopReason(est, rs.size(), next.isPresent());
            if (stop.isPresent()) return new Run(est, rs.size(), stop.get(), rs);
            Item it = next.get();
            boolean correct = rnd.nextDouble() < IrtMath.p(trueTheta, it);
            rs.add(new Response(it, correct));
            est = engine.estimate(rs);
        }
    }

    private static double corr(double[] x, double[] y) {
        int n = x.length;
        double mx = 0, my = 0;
        for (int i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
        mx /= n; my /= n;
        double sxy = 0, sxx = 0, syy = 0;
        for (int i = 0; i < n; i++) {
            sxy += (x[i] - mx) * (y[i] - my);
            sxx += (x[i] - mx) * (x[i] - mx);
            syy += (y[i] - my) * (y[i] - my);
        }
        return sxy / Math.sqrt(sxx * syy);
    }
}

```

## File: src\main\java\com\teamunix\gateway\assessment\engine\SkillMapper.java

`$lang
package com.teamunix.gateway.assessment.engine;

import java.util.ArrayDeque;
import java.util.Collection;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Turns a final ability into MASTERED / FRONTIER / LOCKED for every skill in the DAG. */
public final class SkillMapper {

    public record SkillNode(UUID id, double difficulty, List<UUID> prerequisites) {}

    public enum SkillState { MASTERED, FRONTIER, LOCKED }

    /** margin: a skill counts as mastered when difficulty <= theta - margin. */
    public Map<UUID, SkillState> map(double theta, Collection<SkillNode> nodes, double margin) {
        Map<UUID, SkillNode> byId = new HashMap<>();
        for (SkillNode n : nodes) byId.put(n.id(), n);

        Set<UUID> mastered = new HashSet<>();
        Deque<UUID> stack = new ArrayDeque<>();
        for (SkillNode n : nodes) {
            if (n.difficulty() <= theta - margin) {
                mastered.add(n.id());
                stack.push(n.id());
            }
        }
        // If a skill is mastered, everything it depends on is mastered too.
        while (!stack.isEmpty()) {
            SkillNode n = byId.get(stack.pop());
            for (UUID p : n.prerequisites()) {
                if (mastered.add(p)) stack.push(p);
            }
        }

        Map<UUID, SkillState> out = new LinkedHashMap<>();
        for (SkillNode n : nodes) {
            if (mastered.contains(n.id())) {
                out.put(n.id(), SkillState.MASTERED);
            } else if (mastered.containsAll(n.prerequisites())) {
                out.put(n.id(), SkillState.FRONTIER);
            } else {
                out.put(n.id(), SkillState.LOCKED);
            }
        }
        return out;
    }
}

```

## File: src\main\java\com\teamunix\gateway\assessment\engine\StopReason.java

`$lang
package com.teamunix.gateway.assessment.engine;

public enum StopReason { SE_THRESHOLD, MAX_ITEMS, NO_ITEMS_LEFT }

```

## File: src\main\resources\seed\backend-skills.yaml

`$lang
# Backend Engineering skill graph (seed file)
# Track: backend-engineering. Authored by Dev Sharma, Team Unix.
# difficulty is on the same scale as learner ability (theta), roughly -3 to 3.
# prerequisites list skills that must be learned first. The graph is validated as a DAG on load.
# All difficulty values are expert estimates and should be reviewed by the team and mentors.
track:
  slug: backend-engineering
  name: Backend Engineering
  description: 'Language-agnostic backend track: web APIs, databases, security, architecture, performance, async systems,
    quality and deployment.'
  status: ACTIVE
skills:
- slug: programming-basics
  name: Programming basics
  cluster: foundations
  difficulty: -2.5
  description: Variables, conditions, loops and functions
  prerequisites: []
- slug: core-data-structures
  name: Core data structures
  cluster: foundations
  difficulty: -2.0
  description: Lists, maps, sets, stacks, queues and basic Big-O
  prerequisites:
  - programming-basics
- slug: git-basics
  name: Git and version control
  cluster: foundations
  difficulty: -2.0
  description: Commits, branches, merging and pull requests
  prerequisites: []
- slug: linux-cli-basics
  name: Linux and command line
  cluster: foundations
  difficulty: -1.8
  description: Shell navigation, files, permissions and processes
  prerequisites: []
- slug: error-handling
  name: Error handling and debugging
  cluster: foundations
  difficulty: -1.5
  description: Exceptions, reading stack traces and debugging
  prerequisites:
  - programming-basics
- slug: oop-modular-design
  name: Object-oriented and modular design
  cluster: foundations
  difficulty: -1.0
  description: Classes, interfaces, modules and encapsulation
  prerequisites:
  - programming-basics
- slug: networking-basics
  name: Networking basics
  cluster: web-apis
  difficulty: -1.8
  description: IP, DNS, TCP and how a request travels
  prerequisites: []
- slug: http-basics
  name: HTTP methods, headers and status codes
  cluster: web-apis
  difficulty: -1.5
  description: Request and response structure, verbs, status codes, headers
  prerequisites:
  - networking-basics
- slug: json-serialization
  name: JSON and data serialization
  cluster: web-apis
  difficulty: -1.5
  description: Encoding and decoding data between services
  prerequisites:
  - programming-basics
- slug: rest-api-design
  name: REST API design
  cluster: web-apis
  difficulty: -0.8
  description: Resources, endpoints, verbs and idempotent design
  prerequisites:
  - http-basics
  - json-serialization
- slug: input-validation-errors
  name: Input validation and API error responses
  cluster: web-apis
  difficulty: -0.5
  description: Validating input and returning consistent errors
  prerequisites:
  - rest-api-design
  - error-handling
- slug: api-docs-openapi
  name: API documentation (OpenAPI)
  cluster: web-apis
  difficulty: 0.0
  description: Describing APIs with OpenAPI and Swagger
  prerequisites:
  - rest-api-design
- slug: pagination-versioning
  name: Pagination, filtering and API versioning
  cluster: web-apis
  difficulty: 0.2
  description: Paging large results, filters, and evolving APIs safely
  prerequisites:
  - rest-api-design
- slug: realtime-communication
  name: Real-time communication
  cluster: web-apis
  difficulty: 1.0
  description: WebSockets and server-sent events
  prerequisites:
  - rest-api-design
- slug: sql-basics
  name: SQL basics
  cluster: databases
  difficulty: -1.3
  description: SELECT, INSERT, UPDATE, DELETE and filtering
  prerequisites: []
- slug: sql-joins-aggregation
  name: SQL joins and aggregation
  cluster: databases
  difficulty: -0.3
  description: Joins, GROUP BY, subqueries and views
  prerequisites:
  - sql-basics
- slug: relational-modeling
  name: Relational modeling and normalization
  cluster: databases
  difficulty: -0.5
  description: Tables, keys, relationships and normal forms
  prerequisites:
  - sql-basics
- slug: orm-data-access
  name: ORMs and data access layers
  cluster: databases
  difficulty: -0.2
  description: Mapping objects to tables, repositories, N+1 problem
  prerequisites:
  - sql-basics
  - oop-modular-design
- slug: nosql-basics
  name: NoSQL basics
  cluster: databases
  difficulty: 0.3
  description: Document, key-value and wide-column stores and when to use them
  prerequisites:
  - sql-basics
  - json-serialization
- slug: schema-migrations
  name: Schema migrations
  cluster: databases
  difficulty: 0.4
  description: Versioned, repeatable database changes
  prerequisites:
  - relational-modeling
- slug: indexing-query-performance
  name: Indexing and query performance
  cluster: databases
  difficulty: 0.6
  description: Indexes, query plans and slow query fixes
  prerequisites:
  - relational-modeling
  - sql-joins-aggregation
- slug: transactions-acid
  name: Transactions and ACID
  cluster: databases
  difficulty: 0.7
  description: Atomicity, consistency, isolation, durability
  prerequisites:
  - sql-joins-aggregation
- slug: isolation-concurrency
  name: Isolation levels and locking
  cluster: databases
  difficulty: 1.5
  description: Dirty reads, phantom reads, optimistic and pessimistic locking
  prerequisites:
  - transactions-acid
- slug: replication-sharding
  name: Replication and sharding
  cluster: databases
  difficulty: 1.8
  description: Scaling databases with replicas and partitions
  prerequisites:
  - indexing-query-performance
  - transactions-acid
- slug: password-hashing
  name: Password storage and hashing
  cluster: security
  difficulty: -0.2
  description: Salting, hashing and why never to store plain passwords
  prerequisites:
  - http-basics
- slug: sessions-cookies
  name: Sessions and cookies
  cluster: security
  difficulty: 0.0
  description: Session-based login and cookie flags
  prerequisites:
  - http-basics
  - password-hashing
- slug: jwt-auth
  name: Token-based auth (JWT)
  cluster: security
  difficulty: 0.3
  description: Access and refresh tokens, signing and expiry
  prerequisites:
  - sessions-cookies
  - json-serialization
- slug: authorization-rbac
  name: Authorization and role-based access
  cluster: security
  difficulty: 0.5
  description: Roles, permissions and ownership checks
  prerequisites:
  - jwt-auth
- slug: secrets-management
  name: Secrets and configuration management
  cluster: security
  difficulty: 0.2
  description: Keeping keys out of code, environment config
  prerequisites:
  - git-basics
- slug: web-security-owasp
  name: Common web vulnerabilities
  cluster: security
  difficulty: 0.8
  description: Injection, XSS, CSRF and the OWASP Top 10
  prerequisites:
  - rest-api-design
  - sql-basics
- slug: rate-limiting
  name: Rate limiting and abuse protection
  cluster: security
  difficulty: 0.9
  description: Throttling, quotas and brute-force defence
  prerequisites:
  - rest-api-design
- slug: oauth2-oidc
  name: OAuth 2.0 and OpenID Connect
  cluster: security
  difficulty: 1.2
  description: Delegated login and third-party identity
  prerequisites:
  - jwt-auth
- slug: layered-architecture
  name: Layered architecture
  cluster: architecture
  difficulty: 0.0
  description: Controller, service and repository separation
  prerequisites:
  - oop-modular-design
  - rest-api-design
- slug: dependency-injection
  name: Dependency injection
  cluster: architecture
  difficulty: 0.2
  description: Inversion of control and wiring components
  prerequisites:
  - oop-modular-design
- slug: solid-principles
  name: SOLID and clean design
  cluster: architecture
  difficulty: 0.2
  description: Single responsibility, open-closed and related principles
  prerequisites:
  - oop-modular-design
- slug: design-patterns
  name: Common design patterns
  cluster: architecture
  difficulty: 0.8
  description: Factory, strategy, observer, adapter and similar
  prerequisites:
  - solid-principles
- slug: monolith-vs-microservices
  name: Monolith vs microservices
  cluster: architecture
  difficulty: 1.2
  description: Trade-offs, service boundaries and communication
  prerequisites:
  - layered-architecture
- slug: system-design-scalability
  name: System design and scalability
  cluster: architecture
  difficulty: 2.0
  description: Designing systems for load, failure and growth
  prerequisites:
  - monolith-vs-microservices
  - replication-sharding
  - load-balancing
- slug: caching-basics
  name: Caching basics
  cluster: performance
  difficulty: 0.6
  description: Cache aside, TTL and invalidation
  prerequisites:
  - core-data-structures
  - rest-api-design
- slug: redis-in-memory
  name: In-memory stores
  cluster: performance
  difficulty: 0.9
  description: Redis data types, expiry and typical uses
  prerequisites:
  - caching-basics
  - nosql-basics
- slug: load-balancing
  name: Load balancing and horizontal scaling
  cluster: performance
  difficulty: 1.3
  description: Spreading traffic and stateless services
  prerequisites:
  - http-basics
  - caching-basics
- slug: concurrency-basics
  name: Concurrency basics
  cluster: async-distributed
  difficulty: 0.4
  description: Threads, race conditions and synchronization
  prerequisites:
  - programming-basics
- slug: async-programming
  name: Asynchronous programming
  cluster: async-distributed
  difficulty: 0.6
  description: Event loop, promises, futures and non-blocking I/O
  prerequisites:
  - concurrency-basics
- slug: background-jobs
  name: Background jobs and task queues
  cluster: async-distributed
  difficulty: 0.9
  description: Moving slow work off the request path
  prerequisites:
  - async-programming
- slug: message-queues
  name: Message queues and event streaming
  cluster: async-distributed
  difficulty: 1.1
  description: Producers, consumers, brokers and delivery guarantees
  prerequisites:
  - background-jobs
- slug: idempotency-retries
  name: Idempotency and retries
  cluster: async-distributed
  difficulty: 1.4
  description: Safe retries, deduplication and backoff
  prerequisites:
  - message-queues
  - rest-api-design
- slug: distributed-consistency
  name: Distributed consistency
  cluster: async-distributed
  difficulty: 2.2
  description: CAP theorem, eventual consistency and sagas
  prerequisites:
  - replication-sharding
  - message-queues
- slug: unit-testing
  name: Unit testing
  cluster: quality-observability
  difficulty: -0.6
  description: Writing small, isolated, repeatable tests
  prerequisites:
  - programming-basics
- slug: test-doubles
  name: Mocking and test doubles
  cluster: quality-observability
  difficulty: 0.0
  description: Mocks, stubs and fakes
  prerequisites:
  - unit-testing
- slug: api-integration-testing
  name: API and integration testing
  cluster: quality-observability
  difficulty: 0.4
  description: Testing endpoints and components together
  prerequisites:
  - unit-testing
  - rest-api-design
- slug: logging-monitoring
  name: Logging and monitoring
  cluster: quality-observability
  difficulty: 0.5
  description: Structured logs, health checks and alerts
  prerequisites:
  - error-handling
- slug: observability-tracing
  name: Metrics and distributed tracing
  cluster: quality-observability
  difficulty: 1.4
  description: Metrics, traces and finding failures across services
  prerequisites:
  - logging-monitoring
- slug: docker-basics
  name: Docker and containers
  cluster: devops
  difficulty: 0.2
  description: Images, containers and docker compose
  prerequisites:
  - linux-cli-basics
- slug: ci-cd-basics
  name: CI/CD pipelines
  cluster: devops
  difficulty: 0.5
  description: Automated build, test and deploy
  prerequisites:
  - git-basics
  - unit-testing
- slug: cloud-deployment
  name: Cloud deployment basics
  cluster: devops
  difficulty: 0.9
  description: Deploying and running services on a cloud platform
  prerequisites:
  - docker-basics
  - networking-basics
- slug: container-orchestration
  name: Container orchestration
  cluster: devops
  difficulty: 1.8
  description: 'Kubernetes basics: pods, services and scaling'
  prerequisites:
  - docker-basics
  - load-balancing

```


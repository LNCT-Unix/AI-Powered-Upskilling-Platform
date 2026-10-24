package com.teamunix.gateway.assessment;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamunix.gateway.assessment.AssessmentDtos.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Runs the adaptive placement test. Deliberately small and readable.
 *
 * The algorithm (a simple staircase):
 *   - every learner starts at difficulty 0.0
 *   - a correct answer moves the estimate UP one STEP, a wrong answer moves it DOWN one STEP
 *   - the next question is always the unused ACTIVE question whose difficulty is closest to
 *     the current estimate (ties go to the smaller id, so replays give identical results)
 *   - the test stops after MAX_ITEMS questions, or earlier once MIN_ITEMS have been answered
 *     and the answers have changed direction twice - the estimate is then oscillating around
 *     the learner's level and more questions would not move it much
 *
 * Nothing is kept in memory between requests: every call rebuilds the state from the saved
 * answers, so restarts and resumes just work.
 *
 * Tables used (adjust your migration to match - the code only touches these):
 *   tracks(id, status)
 *   assessments(id, user_id, track_id, status, level, theta, items_administered,
 *               correct_count, stop_reason, completed_at)
 *   assessment_items(id, track_id, difficulty, stem, options, correct_option, status)
 *   assessment_responses(assessment_id, seq, item_id, selected_option, is_correct)
 *   assessment_skill_results(assessment_id, skill_id, state)
 *   skills(id, track_id, name, cluster, difficulty)
 *   skill_prerequisites(skill_id, prerequisite_id)
 *
 * Example question row:
 *   INSERT INTO assessment_items (id, track_id, difficulty, stem, options, correct_option, status)
 *   VALUES (gen_random_uuid(),
 *           (SELECT id FROM tracks WHERE slug = 'backend-engineering'),
 *           0.3, 'Which status code should a POST that creates a resource return?',
 *           '["200","201","204","400"]', 1, 'ACTIVE');
 */
@Service
public class AssessmentService {

    // ----- test settings (plain constants; change here instead of application.yml) -----
    private static final int MIN_ITEMS = 5;             // never stop before this many questions
    private static final int MAX_ITEMS = 9;             // hard limit on test length
    private static final double START_DIFFICULTY = 0.0; // where every learner starts
    private static final double STEP = 0.35;            // how far the estimate moves per answer
    private static final double MASTERY_MARGIN = 0.25;  // mastered = difficulty <= theta - margin
    private static final double BEGINNER_BELOW = -0.5;  // level cut-offs
    private static final double ADVANCED_ABOVE = 0.75;

    private final JdbcClient jdbc;
    private final ObjectMapper mapper;

    public AssessmentService(JdbcClient jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    // ---------- start ----------

    @Transactional
    public AssessmentState start(UUID userId, UUID trackId) {
        String status = jdbc.sql("SELECT status FROM tracks WHERE id = :t").param("t", trackId)
                .query(String.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Track not found"));
        if (!"ACTIVE".equals(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Track is not available yet");
        }

        // one test in progress per user and track: return it instead of starting again
        UUID existing = jdbc.sql("""
                        SELECT id FROM assessments
                        WHERE user_id = :u AND track_id = :t AND status = 'IN_PROGRESS'""")
                .param("u", userId).param("t", trackId)
                .query(UUID.class).optional().orElse(null);
        if (existing != null) return state(userId, existing);

        UUID id = jdbc.sql("""
                        INSERT INTO assessments (user_id, track_id, status)
                        VALUES (:u, :t, 'IN_PROGRESS') RETURNING id""")
                .param("u", userId).param("t", trackId)
                .query(UUID.class).single();
        return state(userId, id);
    }

    // ---------- current state (also used to resume) ----------

    @Transactional(readOnly = true)
    public AssessmentState state(UUID userId, UUID assessmentId) {
        AssessmentRow a = loadOwned(userId, assessmentId, false);
        if (!"IN_PROGRESS".equals(a.status)) return finishedState(a);

        List<Boolean> answers = answerFlags(a.id);
        UUID nextId = nextQuestionId(a.trackId, a.id, thetaOf(answers));
        if (nextId == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No questions available");
        }
        return asState(a.id, a.status, false, nextId, answers.size());
    }

    // ---------- submit an answer ----------

    @Transactional
    public AssessmentState answer(UUID userId, UUID assessmentId, UUID itemId, Integer selectedOption) {
        AssessmentRow a = loadOwned(userId, assessmentId, true);   // row lock: no double submits
        if (!"IN_PROGRESS".equals(a.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assessment already finished");
        }

        List<Boolean> answers = new ArrayList<>(answerFlags(a.id));

        // the submitted question must be exactly the next one the algorithm would serve
        UUID expected = nextQuestionId(a.trackId, a.id, thetaOf(answers));
        if (expected == null || !expected.equals(itemId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That is not the current question");
        }

        ItemRow item = loadItem(itemId);
        List<String> options = parseOptions(item.options);
        if (selectedOption == null || selectedOption < 0 || selectedOption >= options.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid option");
        }
        boolean correct = selectedOption == item.correctOption;

        jdbc.sql("""
                        INSERT INTO assessment_responses (assessment_id, seq, item_id, selected_option, is_correct)
                        VALUES (:a, :seq, :i, :o, :c)""")
                .param("a", a.id).param("seq", answers.size() + 1).param("i", itemId)
                .param("o", selectedOption).param("c", correct)
                .update();

        answers.add(correct);

        String stop = stopReason(answers);
        if (stop == null) {
            UUID nextId = nextQuestionId(a.trackId, a.id, thetaOf(answers));
            if (nextId != null) {
                return asState(a.id, "IN_PROGRESS", false, nextId, answers.size());
            }
            stop = "NO_QUESTIONS_LEFT";   // the pool ran out: finish with what we have
        }
        return finishAssessment(a, answers, stop);
    }

    // ---------- result ----------

    @Transactional(readOnly = true)
    public ResultView result(UUID userId, UUID assessmentId) {
        AssessmentRow a = loadOwned(userId, assessmentId, false);
        if (!"COMPLETED".equals(a.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assessment not finished yet");
        }

        List<SkillResult> skills = jdbc.sql("""
                        SELECT r.skill_id, s.name, s.cluster, r.state
                        FROM assessment_skill_results r JOIN skills s ON s.id = r.skill_id
                        WHERE r.assessment_id = :a ORDER BY s.cluster, s.difficulty""")
                .param("a", assessmentId)
                .query((rs, i) -> {
                    SkillResult sr = new SkillResult();
                    sr.setSkillId((UUID) rs.getObject("skill_id"));
                    sr.setName(rs.getString("name"));
                    sr.setCluster(rs.getString("cluster"));
                    sr.setState(rs.getString("state"));
                    return sr;
                }).list();

        return new ResultView(a.id, a.level, a.theta, a.itemsAdministered, a.correctCount, skills);
    }

    // ---------- core logic ----------

    /** Ability estimate: start at 0, one STEP up per correct answer, one STEP down per wrong answer. */
    private double thetaOf(List<Boolean> answers) {
        double theta = START_DIFFICULTY;
        for (Boolean correct : answers) theta += correct ? STEP : -STEP;
        return theta;
    }

    /** How often the answers switched between correct and wrong. */
    private int directionChanges(List<Boolean> answers) {
        int changes = 0;
        for (int i = 1; i < answers.size(); i++) {
            if (!answers.get(i).equals(answers.get(i - 1))) changes++;
        }
        return changes;
    }

    /** Null means keep going. */
    private String stopReason(List<Boolean> answers) {
        if (answers.size() >= MAX_ITEMS) return "MAX_ITEMS";
        if (answers.size() >= MIN_ITEMS && directionChanges(answers) >= 2) return "LEVEL_CONFIRMED";
        return null;
    }

    /** The unused ACTIVE question whose difficulty is closest to the estimate. Ties: smaller id. */
    private UUID nextQuestionId(UUID trackId, UUID assessmentId, double theta) {
        return jdbc.sql("""
                        SELECT id FROM assessment_items
                        WHERE track_id = :t AND status = 'ACTIVE'
                          AND id NOT IN (SELECT item_id FROM assessment_responses WHERE assessment_id = :a)
                        ORDER BY ABS(difficulty - :th), id
                        LIMIT 1""")
                .param("t", trackId).param("a", assessmentId).param("th", theta)
                .query(UUID.class).optional().orElse(null);
    }

    private String levelOf(double theta) {
        if (theta < BEGINNER_BELOW) return "BEGINNER";
        if (theta > ADVANCED_ABOVE) return "ADVANCED";
        return "INTERMEDIATE";
    }

    /**
     * Simple skill mapping, stored so the result endpoint only has to read it back:
     *   MASTERED - the skill sits clearly below the learner's ability (difficulty <= theta - margin)
     *   FRONTIER - not mastered yet, but every prerequisite is mastered: learn these next
     *   LOCKED   - everything else
     */
    private void saveSkillResults(UUID trackId, UUID assessmentId, double theta) {
        List<SkillRow> skills = jdbc.sql("SELECT id, name, cluster, difficulty FROM skills WHERE track_id = :t")
                .param("t", trackId)
                .query((rs, i) -> new SkillRow((UUID) rs.getObject("id"), rs.getString("name"),
                        rs.getString("cluster"), rs.getDouble("difficulty")))
                .list();

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

        Set<UUID> mastered = new HashSet<>();
        for (SkillRow s : skills) {
            if (s.difficulty <= theta - MASTERY_MARGIN) mastered.add(s.id);
        }

        for (SkillRow s : skills) {
            String state;
            if (mastered.contains(s.id)) {
                state = "MASTERED";
            } else if (mastered.containsAll(prereqs.getOrDefault(s.id, List.of()))) {
                state = "FRONTIER";
            } else {
                state = "LOCKED";
            }
            jdbc.sql("INSERT INTO assessment_skill_results (assessment_id, skill_id, state) VALUES (:a, :s, :st)")
                    .param("a", assessmentId).param("s", s.id).param("st", state)
                    .update();
        }
    }

    /** Stores the final result and the per-skill states, then returns the finished state. */
    private AssessmentState finishAssessment(AssessmentRow a, List<Boolean> answers, String stop) {
        int answered = answers.size();
        int correct = 0;
        for (Boolean ok : answers) if (ok) correct++;

        double theta = thetaOf(answers);
        String level = levelOf(theta);

        jdbc.sql("""
                        UPDATE assessments SET status = 'COMPLETED', theta = :th, level = :lvl,
                            items_administered = :n, correct_count = :c, stop_reason = :r,
                            completed_at = now()
                        WHERE id = :a""")
                .param("th", theta).param("lvl", level).param("n", answered)
                .param("c", correct).param("r", stop).param("a", a.id)
                .update();

        saveSkillResults(a.trackId, a.id, theta);

        AssessmentRow done = new AssessmentRow(a.id, a.trackId, "COMPLETED", level, theta, answered, correct);
        return finishedState(done);
    }

    // ---------- small helpers ----------

    /** Correctness of the saved answers, oldest first. */
    private List<Boolean> answerFlags(UUID assessmentId) {
        return jdbc.sql("SELECT is_correct FROM assessment_responses WHERE assessment_id = :a ORDER BY seq")
                .param("a", assessmentId)
                .query((rs, i) -> rs.getBoolean("is_correct"))
                .list();
    }

    /** Loads the assessment and checks it belongs to this user. lock=true also locks the row. */
    private AssessmentRow loadOwned(UUID userId, UUID assessmentId, boolean lock) {
        String sql = """
                SELECT id, track_id, status, level, COALESCE(theta, 0) AS theta,
                       items_administered, COALESCE(correct_count, 0) AS correct_count
                FROM assessments WHERE id = :id AND user_id = :u""" + (lock ? " FOR UPDATE" : "");
        return jdbc.sql(sql).param("id", assessmentId).param("u", userId)
                .query((rs, i) -> new AssessmentRow((UUID) rs.getObject("id"),
                        (UUID) rs.getObject("track_id"), rs.getString("status"), rs.getString("level"),
                        rs.getDouble("theta"), rs.getInt("items_administered"), rs.getInt("correct_count")))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));
    }

    private ItemRow loadItem(UUID itemId) {
        return jdbc.sql("SELECT id, stem, options::text AS options, correct_option FROM assessment_items WHERE id = :i")
                .param("i", itemId)
                .query((rs, i) -> new ItemRow((UUID) rs.getObject("id"), rs.getString("stem"),
                        rs.getString("options"), rs.getInt("correct_option")))
                .single();
    }

    private List<String> parseOptions(String json) {
        try {
            return mapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Invalid options JSON on an item", e);
        }
    }

    /** State with the next question attached. */
    private AssessmentState asState(UUID assessmentId, String status, boolean done, UUID nextItemId, int answered) {
        ItemRow item = loadItem(nextItemId);
        Question question = new Question(item.id, item.stem, parseOptions(item.options));
        return new AssessmentState(assessmentId, status, done, question, answered, MAX_ITEMS);
    }

    /** State after the test is over: no question, just the counts. */
    private AssessmentState finishedState(AssessmentRow a) {
        return new AssessmentState(a.id, a.status, true, null, a.itemsAdministered, MAX_ITEMS);
    }

    // ---------- row holders (plain classes, only the columns this service needs) ----------

    private static class AssessmentRow {
        final UUID id;
        final UUID trackId;
        final String status;
        final String level;
        final double theta;
        final int itemsAdministered;
        final int correctCount;

        AssessmentRow(UUID id, UUID trackId, String status, String level,
                      double theta, int itemsAdministered, int correctCount) {
            this.id = id;
            this.trackId = trackId;
            this.status = status;
            this.level = level;
            this.theta = theta;
            this.itemsAdministered = itemsAdministered;
            this.correctCount = correctCount;
        }
    }

    private static class ItemRow {
        final UUID id;
        final String stem;
        final String options;      // JSON text: ["option 0", "option 1", ...]
        final int correctOption;   // 0-based index into options

        ItemRow(UUID id, String stem, String options, int correctOption) {
            this.id = id;
            this.stem = stem;
            this.options = options;
            this.correctOption = correctOption;
        }
    }

    private static class SkillRow {
        final UUID id;
        final String name;
        final String cluster;
        final double difficulty;

        SkillRow(UUID id, String name, String cluster, double difficulty) {
            this.id = id;
            this.name = name;
            this.cluster = cluster;
            this.difficulty = difficulty;
        }
    }
}

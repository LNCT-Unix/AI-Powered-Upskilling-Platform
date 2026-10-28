package com.unix.aiupskilling.assessment.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unix.aiupskilling.assessment.dto.AssessmentDtos.*;
import com.unix.aiupskilling.assessment.model.entity.Assessment;
import com.unix.aiupskilling.assessment.model.entity.AssessmentItem;
import com.unix.aiupskilling.assessment.model.entity.AssessmentResponse;
import com.unix.aiupskilling.assessment.model.entity.AssessmentSkillResult;
import com.unix.aiupskilling.assessment.model.entity.Skill;
import com.unix.aiupskilling.assessment.model.entity.Track;
import com.unix.aiupskilling.assessment.repository.AssessmentItemRepository;
import com.unix.aiupskilling.assessment.repository.AssessmentRepository;
import com.unix.aiupskilling.assessment.repository.AssessmentResponseRepository;
import com.unix.aiupskilling.assessment.repository.AssessmentSkillResultRepository;
import com.unix.aiupskilling.assessment.repository.SkillRepository;
import com.unix.aiupskilling.assessment.repository.TrackRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Runs the adaptive placement test using a staircase IRT algorithm.
 *
 * <h2>Onboarding flow</h2>
 * <ol>
 *   <li>User picks a track (e.g. Backend Engineering dropdown).
 *   <li>User selects a few skills they are already comfortable in.
 *   <li>POST /api/v1/assessments with {trackId, knownSkillSlugs} begins the test with an
 *       initial theta (IRT) of 0.0.
 *   <li>If the user answers a question correctly, difficulty increases; otherwise it decreases.
 *   <li>Once completed, GET /api/v1/assessments/{id}/report provides a comprehensive breakdown
 *       of questions answered, correctness, and skills unlocked to update the graph.
 * </ol>
 */
@Service
public class AssessmentService {

    private static final Logger log = LoggerFactory.getLogger(AssessmentService.class);

    // ----- test settings (plain constants; change here instead of application.yml) -----
    private static final int MIN_ITEMS = 5;             // never stop before this many questions
    private static final int MAX_ITEMS = 9;             // hard limit on test length
    private static final double START_DIFFICULTY = 0.0; // initial theta value for every learner
    private static final double STEP = 0.35;            // how far the estimate moves per answer
    private static final double MASTERY_MARGIN = 0.25;  // mastered = difficulty <= theta - margin
    private static final double BEGINNER_BELOW = -0.5;  // level cut-offs
    private static final double ADVANCED_ABOVE = 0.75;

    private final TrackRepository trackRepo;
    private final AssessmentRepository assessmentRepo;
    private final AssessmentItemRepository itemRepo;
    private final AssessmentResponseRepository responseRepo;
    private final SkillRepository skillRepo;
    private final AssessmentSkillResultRepository skillResultRepo;
    private final ObjectMapper mapper;

    public AssessmentService(TrackRepository trackRepo, AssessmentRepository assessmentRepo,
                             AssessmentItemRepository itemRepo, AssessmentResponseRepository responseRepo,
                             SkillRepository skillRepo, AssessmentSkillResultRepository skillResultRepo,
                             ObjectMapper mapper) {
        this.trackRepo = trackRepo;
        this.assessmentRepo = assessmentRepo;
        this.itemRepo = itemRepo;
        this.responseRepo = responseRepo;
        this.skillRepo = skillRepo;
        this.skillResultRepo = skillResultRepo;
        this.mapper = (mapper != null) ? mapper : new ObjectMapper();
    }

    // ---------- onboarding helpers ----------

    /** Returns all ACTIVE tracks for the onboarding track-picker dropdown. */
    @Transactional(readOnly = true)
    public List<TrackSummary> listTracks() {
        return trackRepo.findByStatusOrderByNameAsc("ACTIVE").stream()
                .map(t -> new TrackSummary(t.getId(), t.getSlug(), t.getName()))
                .collect(Collectors.toList());
    }

    /** Returns all skills for a track (for the onboarding skill pre-selection). */
    @Transactional(readOnly = true)
    public List<SkillSummary> listSkillsForTrack(UUID trackId) {
        if (!trackRepo.existsById(trackId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Track not found");
        }
        return skillRepo.findByTrackIdOrderByDifficultyAsc(trackId).stream()
                .map(s -> new SkillSummary(s.getId(), s.getSlug(), s.getName(), s.getCluster(), s.getDifficulty()))
                .collect(Collectors.toList());
    }

    // ---------- start ----------

    @Transactional
    public AssessmentState start(UUID userId, UUID trackId) {
        return start(userId, trackId, List.of());
    }

    /**
     * Starts a new assessment (or resumes an in-progress one).
     *
     * @param userId          the authenticated user
     * @param trackId         the track to assess
     * @param knownSkillSlugs skills the user declared they are comfortable in
     */
    @Transactional
    public AssessmentState start(UUID userId, UUID trackId, List<String> knownSkillSlugs) {
        Track track = trackRepo.findById(trackId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Track not found"));
        if (!"ACTIVE".equals(track.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Track is not available yet");
        }

        // One test in progress per user and track: return it instead of starting again.
        Assessment existing = assessmentRepo
                .findFirstByUserIdAndTrackIdAndStatus(userId, trackId, "IN_PROGRESS").orElse(null);
        if (existing != null) return state(userId, existing.getId());

        // Assessment starts with initial theta = 0.0
        double initialTheta = START_DIFFICULTY;

        Assessment a = new Assessment();
        a.setUserId(userId);
        a.setTrackId(trackId);
        a.setStatus("IN_PROGRESS");
        a.setInitialTheta(initialTheta);
        if (knownSkillSlugs != null && !knownSkillSlugs.isEmpty()) {
            try {
                a.setKnownSkillSlugs(mapper.writeValueAsString(knownSkillSlugs));
            } catch (Exception e) {
                log.warn("Failed to serialize knownSkillSlugs: {}", e.getMessage());
            }
        }
        a = assessmentRepo.save(a);
        return stateWithTheta(userId, a.getId(), initialTheta);
    }

    // ---------- current state (also used to resume) ----------

    @Transactional(readOnly = true)
    public AssessmentState state(UUID userId, UUID assessmentId) {
        Assessment a = owned(userId, assessmentId, false);
        if (!"IN_PROGRESS".equals(a.getStatus())) return finishedState(a);

        List<AssessmentResponse> answers = responseRepo.findByAssessmentIdOrderBySeq(assessmentId);
        double theta = thetaOf(answers, a.getInitialTheta());
        AssessmentItem next = nextItem(a.getTrackId(), a.getId(), theta);
        if (next == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No questions available");
        }
        return asState(a.getId(), a.getStatus(), false, next, answers.size());
    }

    // ---------- submit an answer ----------

    @Transactional
    public AssessmentState answer(UUID userId, UUID assessmentId, UUID itemId, Integer selectedOption) {
        Assessment a = owned(userId, assessmentId, true);   // row lock: no double submits
        if (!"IN_PROGRESS".equals(a.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assessment already finished");
        }

        List<AssessmentResponse> answers = responseRepo.findByAssessmentIdOrderBySeq(assessmentId);
        double theta = thetaOf(answers, a.getInitialTheta());

        // The submitted question must be exactly the next one the algorithm would serve.
        AssessmentItem expected = nextItem(a.getTrackId(), a.getId(), theta);
        if (expected == null || !expected.getId().equals(itemId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That is not the current question");
        }

        List<String> options = parseOptions(expected.getOptions());
        if (selectedOption == null || selectedOption < 0 || selectedOption >= options.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid option");
        }

        AssessmentResponse response = new AssessmentResponse();
        response.setAssessment(a);
        response.setSeq(answers.size() + 1);
        response.setItem(expected);
        response.setSelectedOption(selectedOption);
        response.setCorrect(selectedOption == expected.getCorrectOption());
        responseRepo.save(response);

        answers.add(response);

        String stop = stopReason(answers);
        if (stop == null) {
            double newTheta = thetaOf(answers, a.getInitialTheta());
            AssessmentItem next = nextItem(a.getTrackId(), a.getId(), newTheta);
            if (next != null) {
                return asState(a.getId(), "IN_PROGRESS", false, next, answers.size());
            }
            stop = "NO_QUESTIONS_LEFT";   // the pool ran out: finish with what we have
        }
        return finishAssessment(a, answers, stop);
    }

    // ---------- result ----------

    @Transactional(readOnly = true)
    public ResultView result(UUID userId, UUID assessmentId) {
        Assessment a = owned(userId, assessmentId, false);
        if (!"COMPLETED".equals(a.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assessment not finished yet");
        }

        List<SkillResult> skills = buildSkillResults(assessmentId, a.getTrackId());
        return new ResultView(a.getId(), a.getLevel(), a.getTheta(),
                a.getItemsAdministered(), a.getCorrectCount(), skills);
    }

    // ---------- detailed report ----------

    /**
     * Full post-assessment report.
     * Returns:
     * - Question-by-question breakdown of answers given, correct answers, and skills tested.
     * - Overall counts (answered, correct) and final ability level.
     * - Full skill graph states (MASTERED, FRONTIER, LOCKED).
     * - Unlocked skills (MASTERED and FRONTIER) to update the graph.
     */
    @Transactional(readOnly = true)
    public AssessmentReport report(UUID userId, UUID assessmentId) {
        Assessment a = owned(userId, assessmentId, false);
        if (!"COMPLETED".equals(a.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assessment not finished yet");
        }

        // Build name lookup for skill slugs (from the question pool)
        List<Skill> allSkills = skillRepo.findByTrackIdOrderByDifficultyAsc(a.getTrackId());
        Map<String, String> slugToName = new HashMap<>();
        for (Skill s : allSkills) {
            if (s.getSlug() != null) slugToName.put(s.getSlug(), s.getName());
        }

        // Build per-response detail (with item eagerly fetched)
        List<AssessmentResponse> responses =
                responseRepo.findByAssessmentIdWithItemOrderBySeq(assessmentId);
        List<ResponseDetail> responseDetails = new ArrayList<>();
        for (AssessmentResponse r : responses) {
            AssessmentItem item = r.getItem();
            List<String> opts = parseOptions(item.getOptions());
            String slug = item.getSkillSlug();
            responseDetails.add(new ResponseDetail(
                    r.getSeq(),
                    item.getStem(),
                    opts,
                    r.getSelectedOption(),
                    item.getCorrectOption(),
                    r.isCorrect(),
                    slug,
                    slug != null ? slugToName.getOrDefault(slug, slug) : null
            ));
        }

        // Build full skill graph state
        List<SkillResult> skillResults = buildSkillResults(assessmentId, a.getTrackId());

        // unlockedSkills = all skills that are now accessible (MASTERED or FRONTIER)
        List<SkillResult> unlocked = skillResults.stream()
                .filter(sr -> !"LOCKED".equals(sr.getState()))
                .collect(Collectors.toList());

        double initialTheta = a.getInitialTheta() != null ? a.getInitialTheta() : START_DIFFICULTY;

        return new AssessmentReport(
                a.getId(),
                a.getLevel(),
                initialTheta,
                a.getTheta() != null ? a.getTheta() : initialTheta,
                a.getItemsAdministered() != null ? a.getItemsAdministered() : 0,
                a.getCorrectCount() != null ? a.getCorrectCount() : 0,
                a.getStopReason(),
                responseDetails,
                skillResults,
                unlocked
        );
    }

    // ---------- core algorithm ----------

    /**
     * Running ability estimate.
     * Starts at initialTheta (0.0), then steps up by STEP for correct and down by STEP for incorrect.
     */
    private double thetaOf(List<AssessmentResponse> answers, Double initialTheta) {
        double theta = (initialTheta != null) ? initialTheta : START_DIFFICULTY;
        for (AssessmentResponse r : answers) theta += r.isCorrect() ? STEP : -STEP;
        return theta;
    }

    /** How often the answers switched between correct and wrong. */
    private int directionChanges(List<AssessmentResponse> answers) {
        int changes = 0;
        for (int i = 1; i < answers.size(); i++) {
            if (answers.get(i).isCorrect() != answers.get(i - 1).isCorrect()) changes++;
        }
        return changes;
    }

    /** Null means keep going. */
    private String stopReason(List<AssessmentResponse> answers) {
        if (answers.size() >= MAX_ITEMS) return "MAX_ITEMS";
        if (answers.size() >= MIN_ITEMS && directionChanges(answers) >= 2) return "LEVEL_CONFIRMED";
        return null;
    }

    /** The unused ACTIVE question whose difficulty is closest to the estimate, or null. */
    private AssessmentItem nextItem(UUID trackId, UUID assessmentId, double theta) {
        List<AssessmentItem> found = itemRepo.findNext(trackId, assessmentId, theta, Limit.of(1));
        return found.isEmpty() ? null : found.get(0);
    }

    private String levelOf(double theta) {
        if (theta < BEGINNER_BELOW) return "BEGINNER";
        if (theta > ADVANCED_ABOVE) return "ADVANCED";
        return "INTERMEDIATE";
    }

    /**
     * Skill mapping:
     *   MASTERED - the skill sits clearly below the learner's ability (difficulty <= theta - margin)
     *              OR was declared by the user as a comfortable skill during onboarding
     *   FRONTIER - not mastered yet, but every prerequisite is mastered: ready to unlock next in graph
     *   LOCKED   - everything else
     */
    private void saveSkillResults(Assessment a, double theta) {
        List<Skill> skills = skillRepo.findByTrackIdWithPrerequisites(a.getTrackId());
        Set<String> declaredSlugs = parseSkillSlugs(a.getKnownSkillSlugs());

        Set<UUID> mastered = new HashSet<>();
        for (Skill s : skills) {
            boolean isDeclared = s.getSlug() != null && declaredSlugs.contains(s.getSlug());
            boolean isMasteredByScore = s.getDifficulty() <= theta - MASTERY_MARGIN;
            if (isDeclared || isMasteredByScore) {
                mastered.add(s.getId());
            }
        }

        List<AssessmentSkillResult> results = new ArrayList<>();
        for (Skill s : skills) {
            String state;
            if (mastered.contains(s.getId())) {
                state = "MASTERED";
            } else if (mastered.containsAll(s.getPrerequisites())) {
                state = "FRONTIER";
            } else {
                state = "LOCKED";
            }
            results.add(new AssessmentSkillResult(a, s, state));
        }
        skillResultRepo.saveAll(results);
    }

    /** Stores the final result and the per-skill states, then returns the finished state. */
    private AssessmentState finishAssessment(Assessment a, List<AssessmentResponse> answers, String stop) {
        int answered = answers.size();
        int correct = 0;
        for (AssessmentResponse r : answers) if (r.isCorrect()) correct++;

        double finalTheta = thetaOf(answers, a.getInitialTheta());

        a.setStatus("COMPLETED");
        a.setTheta(finalTheta);
        a.setLevel(levelOf(finalTheta));
        a.setItemsAdministered(answered);
        a.setCorrectCount(correct);
        a.setStopReason(stop);
        a.setCompletedAt(Instant.now());
        assessmentRepo.save(a);

        saveSkillResults(a, finalTheta);
        return finishedState(a);
    }

    /** Reads back the saved skill results for an assessment as DTOs. */
    private List<SkillResult> buildSkillResults(UUID assessmentId, UUID trackId) {
        // Pre-fetch track skills with prerequisites in a single joined query to avoid N+1 queries
        Map<UUID, Set<UUID>> prereqMap = new HashMap<>();
        if (trackId != null) {
            for (Skill s : skillRepo.findByTrackIdWithPrerequisites(trackId)) {
                prereqMap.put(s.getId(), s.getPrerequisites() != null ? new HashSet<>(s.getPrerequisites()) : Collections.emptySet());
            }
        }

        List<SkillResult> skills = new ArrayList<>();
        for (AssessmentSkillResult r : skillResultRepo
                .findByAssessmentIdOrderBySkillClusterAscSkillDifficultyAsc(assessmentId)) {
            SkillResult sr = new SkillResult();
            sr.setSkillId(r.getSkill().getId());
            sr.setSlug(r.getSkill().getSlug());
            sr.setName(r.getSkill().getName());
            sr.setCluster(r.getSkill().getCluster());
            sr.setState(r.getState());
            sr.setPrerequisites(prereqMap.getOrDefault(r.getSkill().getId(), Collections.emptySet()));
            skills.add(sr);
        }
        return skills;
    }

    // ---------- small helpers ----------

    /** Loads the assessment and checks it belongs to this user. lock=true also locks the row. */
    private Assessment owned(UUID userId, UUID assessmentId, boolean lock) {
        return (lock ? assessmentRepo.findByIdAndUserIdForUpdate(assessmentId, userId)
                     : assessmentRepo.findByIdAndUserId(assessmentId, userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));
    }

    private List<String> parseOptions(String json) {
        try {
            return mapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Invalid options JSON on an item", e);
        }
    }

    private Set<String> parseSkillSlugs(String json) {
        if (json == null || json.isBlank()) return Set.of();
        try {
            List<String> list = mapper.readValue(json, new TypeReference<List<String>>() {});
            return new HashSet<>(list);
        } catch (Exception e) {
            return Set.of();
        }
    }

    /** State with the next question attached. */
    private AssessmentState asState(UUID assessmentId, String status, boolean done, AssessmentItem item, int answered) {
        Question question = new Question(item.getId(), item.getStem(), parseOptions(item.getOptions()));
        return new AssessmentState(assessmentId, status, done, question, answered, MAX_ITEMS);
    }

    /** State after the test is over: no question, just the counts. */
    private AssessmentState finishedState(Assessment a) {
        return new AssessmentState(a.getId(), a.getStatus(), true, null,
                a.getItemsAdministered() != null ? a.getItemsAdministered() : 0, MAX_ITEMS);
    }

    /** Used internally by state() when we have the initialTheta in hand already. */
    private AssessmentState stateWithTheta(UUID userId, UUID assessmentId, double initialTheta) {
        Assessment a = owned(userId, assessmentId, false);
        if (!"IN_PROGRESS".equals(a.getStatus())) return finishedState(a);

        List<AssessmentResponse> answers = responseRepo.findByAssessmentIdOrderBySeq(assessmentId);
        double theta = thetaOf(answers, initialTheta);
        AssessmentItem next = nextItem(a.getTrackId(), a.getId(), theta);
        if (next == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No questions available");
        }
        return asState(a.getId(), a.getStatus(), false, next, answers.size());
    }
}

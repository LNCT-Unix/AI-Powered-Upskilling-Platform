package com.unix.aiupskilling.assessment;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unix.aiupskilling.assessment.AssessmentDtos.*;
import com.unix.aiupskilling.assessment.Assessment;
import com.unix.aiupskilling.assessment.AssessmentItem;
import com.unix.aiupskilling.assessment.AssessmentResponse;
import com.unix.aiupskilling.assessment.AssessmentSkillResult;
import com.unix.aiupskilling.assessment.Skill;
import com.unix.aiupskilling.assessment.Track;
import com.unix.aiupskilling.assessment.AssessmentItemRepository;
import com.unix.aiupskilling.assessment.AssessmentRepository;
import com.unix.aiupskilling.assessment.AssessmentResponseRepository;
import com.unix.aiupskilling.assessment.AssessmentSkillResultRepository;
import com.unix.aiupskilling.assessment.SkillRepository;
import com.unix.aiupskilling.assessment.TrackRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Runs the adaptive placement test.
 * Persistence goes through JPA entities and Spring Data repositories.
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
 * Nothing is kept in memory between requests: every call loads the saved answers from the
 * database, so restarts and resumes just work.
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

    // ---------- start ----------

    @Transactional
    public AssessmentState start(UUID userId, UUID trackId) {
        Track track = trackRepo.findById(trackId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Track not found"));
        if (!"ACTIVE".equals(track.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Track is not available yet");
        }

        // one test in progress per user and track: return it instead of starting again
        Assessment existing = assessmentRepo
                .findFirstByUserIdAndTrackIdAndStatus(userId, trackId, "IN_PROGRESS").orElse(null);
        if (existing != null) return state(userId, existing.getId());

        Assessment a = new Assessment();
        a.setUserId(userId);
        a.setTrackId(trackId);
        a.setStatus("IN_PROGRESS");
        a = assessmentRepo.save(a);
        return state(userId, a.getId());
    }

    // ---------- current state (also used to resume) ----------

    @Transactional(readOnly = true)
    public AssessmentState state(UUID userId, UUID assessmentId) {
        Assessment a = owned(userId, assessmentId, false);
        if (!"IN_PROGRESS".equals(a.getStatus())) return finishedState(a);

        List<AssessmentResponse> answers = responseRepo.findByAssessmentIdOrderBySeq(assessmentId);
        AssessmentItem next = nextItem(a.getTrackId(), a.getId(), thetaOf(answers));
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

        // the submitted question must be exactly the next one the algorithm would serve
        AssessmentItem expected = nextItem(a.getTrackId(), a.getId(), thetaOf(answers));
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
            AssessmentItem next = nextItem(a.getTrackId(), a.getId(), thetaOf(answers));
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

        List<SkillResult> skills = new ArrayList<>();
        for (AssessmentSkillResult r : skillResultRepo
                .findByAssessmentIdOrderBySkillClusterAscSkillDifficultyAsc(assessmentId)) {
            SkillResult sr = new SkillResult();
            sr.setSkillId(r.getSkill().getId());
            sr.setName(r.getSkill().getName());
            sr.setCluster(r.getSkill().getCluster());
            sr.setState(r.getState());
            skills.add(sr);
        }

        return new ResultView(a.getId(), a.getLevel(), a.getTheta(),
                a.getItemsAdministered(), a.getCorrectCount(), skills);
    }

    // ---------- core logic ----------

    /** Ability estimate: start at 0, one STEP up per correct answer, one STEP down per wrong answer. */
    private double thetaOf(List<AssessmentResponse> answers) {
        double theta = START_DIFFICULTY;
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
     * Simple skill mapping, saved so the result endpoint only has to read it back:
     *   MASTERED - the skill sits clearly below the learner's ability (difficulty <= theta - margin)
     *   FRONTIER - not mastered yet, but every prerequisite is mastered: learn these next
     *   LOCKED   - everything else
     */
    private void saveSkillResults(Assessment a, double theta) {
        List<Skill> skills = skillRepo.findByTrackIdWithPrerequisites(a.getTrackId());

        Set<UUID> mastered = new HashSet<>();
        for (Skill s : skills) {
            if (s.getDifficulty() <= theta - MASTERY_MARGIN) mastered.add(s.getId());
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

        a.setStatus("COMPLETED");
        a.setTheta(thetaOf(answers));
        a.setLevel(levelOf(thetaOf(answers)));
        a.setItemsAdministered(answered);
        a.setCorrectCount(correct);
        a.setStopReason(stop);
        a.setCompletedAt(Instant.now());
        assessmentRepo.save(a);

        saveSkillResults(a, thetaOf(answers));
        return finishedState(a);
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

    /** State with the next question attached. */
    private AssessmentState asState(UUID assessmentId, String status, boolean done, AssessmentItem item, int answered) {
        Question question = new Question(item.getId(), item.getStem(), parseOptions(item.getOptions()));
        return new AssessmentState(assessmentId, status, done, question, answered, MAX_ITEMS);
    }

    /** State after the test is over: no question, just the counts. */
    private AssessmentState finishedState(Assessment a) {
        return new AssessmentState(a.getId(), a.getStatus(), true, null,
                a.getItemsAdministered(), MAX_ITEMS);
    }
}

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
import java.util.Comparator;
import java.util.Optional;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
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
 *   <li>POST /api/v1/assessments with {trackId, knownSkillSlugs} begins the test.
 *   <li>If the user answers correctly, difficulty increases; otherwise it decreases.
 *   <li>Once completed, GET /api/v1/assessments/{id}/report gives the full breakdown.
 * </ol>
 *
 * <h2>Algorithm & Query design</h2>
 * <ul>
 *   <li>Adaptive item selection queries the question pool using an indexed anti-join on answered responses.
 *   <li>Theta calculation, difficulty stepping, and early-stop checks run dynamically.
 * </ul>
 */
@Service
public class AssessmentService {

    private static final Logger log = LoggerFactory.getLogger(AssessmentService.class);

    private static final int MIN_ITEMS = 8;
    private static final int MAX_ITEMS = 9;
    private static final double START_DIFFICULTY = 0.0;
    private static final double STEP = 0.35;
    private static final double MASTERY_MARGIN = 0.25;
    private static final double BEGINNER_BELOW = -0.5;
    private static final double ADVANCED_ABOVE = 0.75;

    private final TrackRepository trackRepo;
    private final AssessmentRepository assessmentRepo;
    private final AssessmentResponseRepository responseRepo;
    private final SkillRepository skillRepo;
    private final AssessmentSkillResultRepository skillResultRepo;
    private final AssessmentItemRepository itemRepo;
    private final ObjectMapper mapper;

    @Value("${assistant.service.url:http://localhost:3002}")
    private String assistantServiceUrl;

    @Value("${assistant.service.internal-api-key:}")
    private String assistantInternalApiKey;

    public AssessmentService(TrackRepository trackRepo, AssessmentRepository assessmentRepo,
                             AssessmentResponseRepository responseRepo,
                             SkillRepository skillRepo, AssessmentSkillResultRepository skillResultRepo,
                             AssessmentItemRepository itemRepo, ObjectMapper mapper) {
        this.trackRepo = trackRepo;
        this.assessmentRepo = assessmentRepo;
        this.responseRepo = responseRepo;
        this.skillRepo = skillRepo;
        this.skillResultRepo = skillResultRepo;
        this.itemRepo = itemRepo;
        this.mapper = (mapper != null) ? mapper : new ObjectMapper();
    }

    // ---------- onboarding helpers ----------

    @Transactional(readOnly = true)
    public List<TrackSummary> listTracks() {
        return trackRepo.findByStatusOrderByNameAsc("ACTIVE").stream()
                .map(t -> new TrackSummary(t.getId(), t.getSlug(), t.getName()))
                .collect(Collectors.toList());
    }

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

    @Transactional
    public AssessmentState start(UUID userId, UUID trackId, List<String> knownSkillSlugs) {
        Track track = trackRepo.findById(trackId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Track not found"));
        if (!"ACTIVE".equals(track.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Track is not available yet");
        }

        Assessment existing = assessmentRepo
                .findFirstByUserIdAndTrackIdAndStatus(userId, trackId, "IN_PROGRESS").orElse(null);
        if (existing != null) return state(userId, existing.getId());

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

        AssessmentItem first = pickNext(trackId, a.getId(), initialTheta);
        if (first == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No questions available");
        }
        return asState(a.getId(), a.getStatus(), false, first, 0);
    }

    // ---------- current state ----------

    @Transactional(readOnly = true)
    public AssessmentState state(UUID userId, UUID assessmentId) {
        Assessment a = owned(userId, assessmentId);
        if (!"IN_PROGRESS".equals(a.getStatus())) return finishedState(a);

        List<AssessmentResponse> answers = responseRepo.findByAssessmentIdOrderBySeq(assessmentId);
        double theta = thetaOf(answers, a.getInitialTheta());

        AssessmentItem next = pickNext(a.getTrackId(), a.getId(), theta);
        if (next == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No questions available");
        }
        return asState(a.getId(), a.getStatus(), false, next, answers.size());
    }

    // ---------- submit an answer ----------

    @Transactional
    public AssessmentState answer(UUID userId, UUID assessmentId, UUID itemId, Integer selectedOption) {
        Assessment a = owned(userId, assessmentId);
        if (!"IN_PROGRESS".equals(a.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assessment already finished");
        }

        List<AssessmentResponse> answers = responseRepo.findByAssessmentIdOrderBySeq(assessmentId);
        double theta = thetaOf(answers, a.getInitialTheta());

        // Validate that submitted item matches expected item
        AssessmentItem expected = pickNext(a.getTrackId(), a.getId(), theta);
        if (expected == null || !expected.getId().equals(itemId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That is not the current question");
        }

        List<String> options = parseOptions(expected.getOptions());
        if (selectedOption == null || selectedOption < 0 || selectedOption >= options.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid option");
        }

        // Persist response
        boolean isCorrect = selectedOption == expected.getCorrectOption();
        AssessmentResponse response = new AssessmentResponse();
        response.setAssessment(a);
        response.setSeq(answers.size() + 1);
        response.setItem(expected);
        response.setSelectedOption(selectedOption);
        response.setCorrect(isCorrect);
        responseRepo.saveAndFlush(response);

        // Update in-memory state
        answers.add(response);
        // Build lastEvaluation for AI voice companion
        String skillSlug = expected.getSkillSlug();
        String skillName = "General Engineering";
        String topicName = "Core Concepts";
        if (skillSlug != null) {
            Optional<Skill> skillOpt = skillRepo.findByTrackIdAndSlug(a.getTrackId(), skillSlug);
            if (skillOpt.isPresent()) {
                Skill s = skillOpt.get();
                if (s.getName() != null) skillName = s.getName();
                if (s.getCluster() != null) topicName = s.getCluster();
            } else {
                skillName = skillSlug;
            }
        }
        String diffLevel = expected.getDifficulty() <= 0.0 ? "Beginner"
                : (expected.getDifficulty() <= 1.0 ? "Intermediate" : "Advanced");
        String correctText = (expected.getCorrectOption() >= 0 && expected.getCorrectOption() < options.size())
                ? options.get(expected.getCorrectOption()) : "";
        String userText = (selectedOption >= 0 && selectedOption < options.size())
                ? options.get(selectedOption) : "";
        LastEvaluation lastEval = new LastEvaluation(
                a.getId(), expected.getId(), skillName, topicName,
                expected.getStem(), options, correctText, userText, isCorrect, diffLevel
        );


        // Check stop condition
        String stop = stopReason(answers);
        if (stop == null) {
            double newTheta = theta + (isCorrect ? STEP : -STEP);
            AssessmentItem next = pickNext(a.getTrackId(), a.getId(), newTheta);
            if (next != null) {
                return asState(a.getId(), "IN_PROGRESS", false, next, answers.size(), lastEval);
            }
            stop = "NO_QUESTIONS_LEFT";
        }

        return finishAssessment(a, answers, stop, lastEval);
    }

    // ---------- result ----------

    @Transactional(readOnly = true)
    public ResultView result(UUID userId, UUID assessmentId) {
        Assessment a = owned(userId, assessmentId);
        if (!"COMPLETED".equals(a.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assessment not finished yet");
        }
        List<SkillResult> skills = buildSkillResults(assessmentId, a.getTrackId());
        return new ResultView(a.getId(), a.getLevel(), a.getTheta(),
                a.getItemsAdministered(), a.getCorrectCount(), skills);
    }

    // ---------- detailed report ----------

    @Transactional(readOnly = true)
    public AssessmentReport report(UUID userId, UUID assessmentId) {
        Assessment a = owned(userId, assessmentId);
        if (!"COMPLETED".equals(a.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assessment not finished yet");
        }

        List<Skill> allSkills = skillRepo.findByTrackIdOrderByDifficultyAsc(a.getTrackId());
        Map<String, String> slugToName = new HashMap<>();
        for (Skill s : allSkills) {
            if (s.getSlug() != null) slugToName.put(s.getSlug(), s.getName());
        }

        List<AssessmentResponse> responses =
                responseRepo.findByAssessmentIdWithItemOrderBySeq(assessmentId);
        List<ResponseDetail> responseDetails = new ArrayList<>();
        for (AssessmentResponse r : responses) {
            AssessmentItem item = r.getItem();
            List<String> opts = parseOptions(item.getOptions());
            String slug = item.getSkillSlug();
            responseDetails.add(new ResponseDetail(
                    r.getSeq(), item.getStem(), opts,
                    r.getSelectedOption(), item.getCorrectOption(), r.isCorrect(),
                    slug, slug != null ? slugToName.getOrDefault(slug, slug) : null
            ));
        }

        List<SkillResult> skillResults = buildSkillResults(assessmentId, a.getTrackId());
        List<SkillResult> unlocked = skillResults.stream()
                .filter(sr -> !"LOCKED".equals(sr.getState()))
                .collect(Collectors.toList());

        double initialTheta = a.getInitialTheta() != null ? a.getInitialTheta() : START_DIFFICULTY;
        return new AssessmentReport(
                a.getId(), a.getLevel(), initialTheta,
                a.getTheta() != null ? a.getTheta() : initialTheta,
                a.getItemsAdministered() != null ? a.getItemsAdministered() : 0,
                a.getCorrectCount() != null ? a.getCorrectCount() : 0,
                a.getStopReason(), responseDetails, skillResults, unlocked
        );
    }

    // ---------- history ----------

    @Transactional(readOnly = true)
    public List<AssessmentHistoryItem> getHistory(UUID userId) {
        List<Assessment> assessments = assessmentRepo.findHistoryByUserId(userId);
        Map<UUID, String> trackNames = trackRepo.findAll().stream()
                .collect(Collectors.toMap(Track::getId, Track::getName, (a, b) -> a));

        return assessments.stream()
                .map(a -> new AssessmentHistoryItem(
                        a.getId(),
                        a.getTrackId(),
                        trackNames.getOrDefault(a.getTrackId(), "Backend Engineering"),
                        a.getStatus(),
                        a.getLevel(),
                        a.getTheta(),
                        a.getItemsAdministered() != null ? a.getItemsAdministered() : 0,
                        a.getCorrectCount() != null ? a.getCorrectCount() : 0,
                        a.getStopReason(),
                        a.getCompletedAt()
                ))
                .collect(Collectors.toList());
    }

    // ---------- 5-question node unlock quiz ----------

    /**
     * Serves 5 questions for a specific skill node on the competency graph.
     * Direct matches are loaded first, falling back to same-cluster and track items
     * to guarantee that 5 questions are always provided.
     */
    @Transactional(readOnly = true)
    public SkillQuizResponse getQuizForSkill(String skillSlug) {
        Skill skill = skillRepo.findFirstBySlug(skillSlug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Skill not found: " + skillSlug));

        List<AssessmentItem> selectedItems = new ArrayList<>();
        Set<UUID> seenItemIds = new HashSet<>();

        // 1. Primary: Load active items directly linked to this skill
        List<AssessmentItem> directItems = itemRepo.findBySkillSlugAndStatus(skillSlug, "ACTIVE");
        for (AssessmentItem item : directItems) {
            if (seenItemIds.add(item.getId())) {
                selectedItems.add(item);
            }
            if (selectedItems.size() == 5) break;
        }

        // 2. Secondary fallback: Load active items from the same cluster
        if (selectedItems.size() < 5 && skill.getCluster() != null) {
            List<Skill> clusterSkills = skillRepo.findByTrackIdAndCluster(skill.getTrackId(), skill.getCluster());
            List<String> clusterSlugs = clusterSkills.stream()
                    .map(Skill::getSlug)
                    .filter(s -> s != null && !s.equals(skillSlug))
                    .collect(Collectors.toList());
            if (!clusterSlugs.isEmpty()) {
                List<AssessmentItem> clusterItems = itemRepo.findBySkillSlugInAndStatus(clusterSlugs, "ACTIVE");
                for (AssessmentItem item : clusterItems) {
                    if (seenItemIds.add(item.getId())) {
                        selectedItems.add(item);
                    }
                    if (selectedItems.size() == 5) break;
                }
            }
        }

        // 3. Tertiary fallback: Any active items from the track closest to skill difficulty
        if (selectedItems.size() < 5) {
            List<AssessmentItem> trackItems = new ArrayList<>(itemRepo.findByTrackIdAndStatusOrderByDifficultyAsc(skill.getTrackId(), "ACTIVE"));
            trackItems.sort(Comparator.comparingDouble(i -> Math.abs(i.getDifficulty() - skill.getDifficulty())));
            for (AssessmentItem item : trackItems) {
                if (seenItemIds.add(item.getId())) {
                    selectedItems.add(item);
                }
                if (selectedItems.size() == 5) break;
            }
        }

        if (selectedItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No questions available for skill: " + skillSlug);
        }

        List<SkillQuizQuestion> questions = new ArrayList<>();
        for (int i = 0; i < selectedItems.size(); i++) {
            AssessmentItem item = selectedItems.get(i);
            questions.add(new SkillQuizQuestion(
                    item.getId(),
                    i + 1,
                    item.getStem(),
                    parseOptions(item.getOptions())
            ));
        }

        return new SkillQuizResponse(
                skill.getSlug(),
                skill.getName(),
                questions.size(),
                3,
                questions
        );
    }

    /**
     * Evaluates the 5 submitted answers for a skill unlock quiz.
     * If the user answers at least 3/5 correctly, marks the node as ready to learn and unlocks it.
     */
    @Transactional
    public SkillQuizResult submitQuizForSkill(UUID userId, String skillSlug, SkillQuizSubmission submission) {
        Skill skill = skillRepo.findFirstBySlug(skillSlug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Skill not found: " + skillSlug));

        List<SkillQuizAnswer> answers = (submission != null && submission.getAnswers() != null)
                ? submission.getAnswers()
                : Collections.emptyList();

        if (answers.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No answers submitted");
        }

        List<UUID> itemIds = answers.stream().map(SkillQuizAnswer::getItemId).collect(Collectors.toList());
        Map<UUID, AssessmentItem> itemMap = itemRepo.findAllById(itemIds).stream()
                .collect(Collectors.toMap(AssessmentItem::getId, item -> item));

        int correctCount = 0;
        List<QuestionReviewItem> breakdown = new ArrayList<>();

        for (SkillQuizAnswer ans : answers) {
            AssessmentItem item = itemMap.get(ans.getItemId());
            if (item == null) {
                continue;
            }
            boolean isCorrect = (ans.getSelectedOption() != null && ans.getSelectedOption() == item.getCorrectOption());
            if (isCorrect) {
                correctCount++;
            }
            breakdown.add(new QuestionReviewItem(
                    item.getId(),
                    item.getStem(),
                    parseOptions(item.getOptions()),
                    ans.getSelectedOption() != null ? ans.getSelectedOption() : -1,
                    item.getCorrectOption(),
                    isCorrect
            ));
        }

        int total = answers.size();
        int passingScore = 3;
        boolean passed = correctCount >= passingScore;

        String newState = passed ? "READY_TO_LEARN" : "LOCKED";
        String message = passed
                ? String.format("Passed! You scored %d/%d. %s is unlocked and ready to learn.", correctCount, total, skill.getName())
                : String.format("You scored %d/%d. At least %d correct answers are needed to unlock %s.", correctCount, total, passingScore, skill.getName());

        if (passed) {
            Assessment assessment = null;
            if (submission != null && submission.getAssessmentId() != null) {
                assessment = assessmentRepo.findByIdAndUserId(submission.getAssessmentId(), userId).orElse(null);
            }
            if (assessment == null) {
                assessment = assessmentRepo.findFirstByUserIdAndTrackIdOrderByCompletedAtDesc(userId, skill.getTrackId())
                        .or(() -> assessmentRepo.findFirstByUserIdOrderByCompletedAtDesc(userId))
                        .orElse(null);
            }

            if (assessment != null) {
                Optional<AssessmentSkillResult> existing = skillResultRepo.findByAssessmentIdAndSkillId(assessment.getId(), skill.getId());
                if (existing.isPresent()) {
                    AssessmentSkillResult asr = existing.get();
                    asr.setState(newState);
                    skillResultRepo.save(asr);
                } else {
                    AssessmentSkillResult asr = new AssessmentSkillResult(assessment, skill, newState);
                    skillResultRepo.save(asr);
                }

                // Check downstream skills: if all prerequisites of a locked skill are now satisfied, advance to FRONTIER
                updateDownstreamSkillStates(assessment.getId(), assessment.getTrackId());
            }
        }

        return new SkillQuizResult(
                passed,
                correctCount,
                total,
                passingScore,
                skill.getSlug(),
                newState,
                message,
                breakdown
        );
    }

    private void updateDownstreamSkillStates(UUID assessmentId, UUID trackId) {
        if (trackId == null) return;
        List<Skill> allSkills = skillRepo.findByTrackIdWithPrerequisites(trackId);
        List<AssessmentSkillResult> results = skillResultRepo.findByAssessmentIdOrderBySkillClusterAscSkillDifficultyAsc(assessmentId);
        Map<UUID, AssessmentSkillResult> resultMap = results.stream()
                .collect(Collectors.toMap(r -> r.getSkill().getId(), r -> r));

        Set<UUID> unlockedIds = new HashSet<>();
        for (AssessmentSkillResult r : results) {
            String st = r.getState();
            if ("MASTERED".equalsIgnoreCase(st) || "READY_TO_LEARN".equalsIgnoreCase(st) || "UNLOCKED".equalsIgnoreCase(st)) {
                unlockedIds.add(r.getSkill().getId());
            }
        }

        List<AssessmentSkillResult> toUpdate = new ArrayList<>();
        for (Skill s : allSkills) {
            AssessmentSkillResult r = resultMap.get(s.getId());
            if (r != null && "LOCKED".equalsIgnoreCase(r.getState())) {
                Set<UUID> prereqs = s.getPrerequisites();
                if (prereqs == null || prereqs.isEmpty() || unlockedIds.containsAll(prereqs)) {
                    r.setState("FRONTIER");
                    toUpdate.add(r);
                }
            }
        }
        if (!toUpdate.isEmpty()) {
            skillResultRepo.saveAll(toUpdate);
        }
    }

    // ---------- core algorithm (all in-memory) ----------

    private double thetaOf(List<AssessmentResponse> answers, Double initialTheta) {
        double theta = (initialTheta != null) ? initialTheta : START_DIFFICULTY;
        for (AssessmentResponse r : answers) theta += r.isCorrect() ? STEP : -STEP;
        return theta;
    }

    private int directionChanges(List<AssessmentResponse> answers) {
        int changes = 0;
        for (int i = 1; i < answers.size(); i++) {
            if (answers.get(i).isCorrect() != answers.get(i - 1).isCorrect()) changes++;
        }
        return changes;
    }

    private String stopReason(List<AssessmentResponse> answers) {
        if (answers.size() >= MAX_ITEMS) return "MAX_ITEMS";
        if (answers.size() >= MIN_ITEMS && directionChanges(answers) >= 2) return "LEVEL_CONFIRMED";
        return null;
    }

    private AssessmentItem pickNext(UUID trackId, UUID assessmentId, double theta) {
        return itemRepo.findNext(trackId, assessmentId, theta, Limit.of(1)).stream()
                .findFirst()
                .orElse(null);
    }

    private String levelOf(double theta) {
        if (theta < BEGINNER_BELOW) return "BEGINNER";
        if (theta > ADVANCED_ABOVE) return "ADVANCED";
        return "INTERMEDIATE";
    }

    private void saveSkillResults(Assessment a, double theta) {
        List<Skill> skills = skillRepo.findByTrackIdWithPrerequisites(a.getTrackId());
        Set<String> declaredSlugs = parseSkillSlugs(a.getKnownSkillSlugs());

        Set<UUID> mastered = new HashSet<>();
        for (Skill s : skills) {
            boolean isDeclared = s.getSlug() != null && declaredSlugs.contains(s.getSlug());
            boolean isMasteredByScore = s.getDifficulty() <= theta - MASTERY_MARGIN;
            if (isDeclared || isMasteredByScore) mastered.add(s.getId());
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

    private AssessmentState finishAssessment(Assessment a, List<AssessmentResponse> answers, String stop) {
        return finishAssessment(a, answers, stop, null);
    }

    private AssessmentState finishAssessment(Assessment a, List<AssessmentResponse> answers, String stop, LastEvaluation lastEvaluation) {
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
        return finishedState(a, lastEvaluation);
    }

    private List<SkillResult> buildSkillResults(UUID assessmentId, UUID trackId) {
        Map<UUID, Set<UUID>> prereqMap = new HashMap<>();
        if (trackId != null) {
            for (Skill s : skillRepo.findByTrackIdWithPrerequisites(trackId)) {
                prereqMap.put(s.getId(), s.getPrerequisites() != null
                        ? new HashSet<>(s.getPrerequisites()) : Collections.emptySet());
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

    private Assessment owned(UUID userId, UUID assessmentId) {
        return assessmentRepo.findByIdAndUserId(assessmentId, userId)
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

    private AssessmentState asState(UUID assessmentId, String status, boolean done,
                                    AssessmentItem item, int answered) {
        return asState(assessmentId, status, done, item, answered, null);
    }

    private AssessmentState asState(UUID assessmentId, String status, boolean done,
                                    AssessmentItem item, int answered, LastEvaluation lastEvaluation) {
        Question question = item != null ? new Question(item.getId(), item.getStem(), parseOptions(item.getOptions())) : null;
        return new AssessmentState(assessmentId, status, done, question, answered, MAX_ITEMS, lastEvaluation);
    }

    private AssessmentState finishedState(Assessment a) {
        return finishedState(a, null);
    }

    private AssessmentState finishedState(Assessment a, LastEvaluation lastEvaluation) {
        return new AssessmentState(a.getId(), a.getStatus(), true, null,
                a.getItemsAdministered() != null ? a.getItemsAdministered() : 0, MAX_ITEMS, lastEvaluation);
    }

    /** Forward voice feedback request to AI assistant service, passing internal credentials securely */
    public ResponseEntity<String> forwardVoiceFeedback(Map<String, Object> payload) {
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            String jsonBody = mapper.writeValueAsString(payload);
            String targetUrl = (assistantServiceUrl != null ? assistantServiceUrl.replaceAll("/+$", "") : "http://localhost:3002") + "/api/assessment/voice-feedback";

            java.net.http.HttpRequest.Builder reqBuilder = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(targetUrl))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json");

            if (assistantInternalApiKey != null && !assistantInternalApiKey.isBlank()) {
                reqBuilder.header("X-Internal-API-Key", assistantInternalApiKey);
            }

            java.net.http.HttpRequest request = reqBuilder
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonBody, java.nio.charset.StandardCharsets.UTF_8))
                    .timeout(java.time.Duration.ofSeconds(30))
                    .build();

            java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());

            String modifiedBody = response.body().replace("/api/assessment/voice-feedback/audio/", "/api/v1/assessments/voice-feedback/audio/");
            return ResponseEntity.status(response.statusCode())
                    .header("Content-Type", "application/json")
                    .body(modifiedBody);
        } catch (Exception e) {
            log.warn("voice_feedback_forward_error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .header("Content-Type", "application/json")
                    .body("{\"success\":false,\"error\":{\"code\":\"UPSTREAM_ERROR\",\"message\":\"" + e.getMessage() + "\"}}");
        }
    }

    /** Forward audio streaming requests from gateway to assistant service, passing HTTP Range header */
    public ResponseEntity<byte[]> streamVoiceAudio(String audioId, String rangeHeader) {
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            String targetUrl = (assistantServiceUrl != null ? assistantServiceUrl.replaceAll("/+$", "") : "http://localhost:3002")
                    + "/api/assessment/voice-feedback/audio/" + audioId;

            java.net.http.HttpRequest.Builder reqBuilder = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(targetUrl))
                    .GET();

            if (rangeHeader != null && !rangeHeader.isBlank()) {
                reqBuilder.header("Range", rangeHeader);
            }

            java.net.http.HttpRequest request = reqBuilder.build();
            java.net.http.HttpResponse<byte[]> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofByteArray());

            org.springframework.http.ResponseEntity.BodyBuilder builder = ResponseEntity.status(response.statusCode());
            response.headers().firstValue("Content-Type").ifPresent(ct -> builder.header("Content-Type", ct));
            response.headers().firstValue("Content-Range").ifPresent(cr -> builder.header("Content-Range", cr));
            response.headers().firstValue("Accept-Ranges").ifPresent(ar -> builder.header("Accept-Ranges", ar));
            response.headers().firstValue("Cache-Control").ifPresent(cc -> builder.header("Cache-Control", cc));

            return builder.body(response.body());
        } catch (Exception e) {
            log.warn("voice_audio_forward_error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
}

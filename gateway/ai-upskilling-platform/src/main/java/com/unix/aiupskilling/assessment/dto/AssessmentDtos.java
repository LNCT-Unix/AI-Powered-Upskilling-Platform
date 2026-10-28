package com.unix.aiupskilling.assessment.dto;

import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Request and response shapes, as plain classes (getters/setters).
 * Questions never carry the correct answer or the difficulty values.
 */
public final class AssessmentDtos {

    private AssessmentDtos() {}

    // ---------- requests ----------

    /**
     * Body of POST /api/v1/assessments.
     * knownSkillSlugs: slugs of skills the user already knows (from the onboarding dropdown).
     * These are used to compute a higher starting theta so the test begins at the right difficulty.
     */
    public static class StartRequest {
        @NotNull
        private UUID trackId;

        /** Slugs of skills the learner already knows, selected during onboarding. May be empty. */
        private List<String> knownSkillSlugs = new ArrayList<>();

        public StartRequest() {}

        public StartRequest(UUID trackId) {
            this.trackId = trackId;
        }

        public StartRequest(UUID trackId, List<String> knownSkillSlugs) {
            this.trackId = trackId;
            this.knownSkillSlugs = knownSkillSlugs != null ? knownSkillSlugs : new ArrayList<>();
        }

        public UUID getTrackId() { return trackId; }
        public void setTrackId(UUID trackId) { this.trackId = trackId; }
        public List<String> getKnownSkillSlugs() { return knownSkillSlugs; }
        public void setKnownSkillSlugs(List<String> knownSkillSlugs) {
            this.knownSkillSlugs = knownSkillSlugs != null ? knownSkillSlugs : new ArrayList<>();
        }
    }

    /** Body of POST /api/v1/assessments/{id}/responses. */
    public static class AnswerRequest {
        @NotNull
        private UUID itemId;
        @NotNull
        private Integer selectedOption;

        public AnswerRequest() {}

        public AnswerRequest(UUID itemId, Integer selectedOption) {
            this.itemId = itemId;
            this.selectedOption = selectedOption;
        }

        public UUID getItemId() { return itemId; }
        public void setItemId(UUID itemId) { this.itemId = itemId; }
        public Integer getSelectedOption() { return selectedOption; }
        public void setSelectedOption(Integer selectedOption) { this.selectedOption = selectedOption; }
    }

    // ---------- responses ----------

    /** Summary of an available track (returned by GET /api/v1/assessments/tracks). */
    public static class TrackSummary {
        private final UUID trackId;
        private final String slug;
        private final String name;

        public TrackSummary(UUID trackId, String slug, String name) {
            this.trackId = trackId;
            this.slug = slug;
            this.name = name;
        }

        public UUID getTrackId() { return trackId; }
        public String getSlug() { return slug; }
        public String getName() { return name; }
    }

    /** Summary of a skill for the onboarding selection screen. */
    public static class SkillSummary {
        private final UUID skillId;
        private final String slug;
        private final String name;
        private final String cluster;
        private final double difficulty;

        public SkillSummary(UUID skillId, String slug, String name, String cluster, double difficulty) {
            this.skillId = skillId;
            this.slug = slug;
            this.name = name;
            this.cluster = cluster;
            this.difficulty = difficulty;
        }

        public UUID getSkillId() { return skillId; }
        public String getSlug() { return slug; }
        public String getName() { return name; }
        public String getCluster() { return cluster; }
        public double getDifficulty() { return difficulty; }
    }

    /** One question as the learner sees it. */
    public static class Question {
        private final UUID itemId;
        private final String stem;
        private final List<String> options;

        public Question(UUID itemId, String stem, List<String> options) {
            this.itemId = itemId;
            this.stem = stem;
            this.options = options;
        }

        public UUID getItemId() { return itemId; }
        public String getStem() { return stem; }
        public List<String> getOptions() { return options; }
    }

    /** Progress representation matching API contract. */
    public static class Progress {
        private final int answered;
        private final int max;

        public Progress(int answered, int max) {
            this.answered = answered;
            this.max = max;
        }

        public int getAnswered() { return answered; }
        public int getMax() { return max; }
    }

    /** Where the learner is right now. question is null once the test is done. */
    public static class AssessmentState {
        private final UUID assessmentId;
        private final String status;      // IN_PROGRESS or COMPLETED
        private final boolean done;
        private final Question question;  // null when done
        private final int answered;
        private final int max;

        public AssessmentState(UUID assessmentId, String status, boolean done,
                               Question question, int answered, int max) {
            this.assessmentId = assessmentId;
            this.status = status;
            this.done = done;
            this.question = question;
            this.answered = answered;
            this.max = max;
        }

        public UUID getAssessmentId() { return assessmentId; }
        public String getStatus() { return status; }
        public boolean isDone() { return done; }
        public Question getQuestion() { return question; }
        public int getAnswered() { return answered; }
        public int getMax() { return max; }
        public Progress getProgress() { return new Progress(answered, max); }
    }

    /** One skill in the result. */
    public static class SkillResult {
        private UUID skillId;
        private String slug;
        private String name;
        private String cluster;
        private String state;   // MASTERED, FRONTIER or LOCKED
        private Set<UUID> prerequisites = new HashSet<>();

        public SkillResult() {}

        public SkillResult(UUID skillId, String slug, String name, String cluster, String state) {
            this(skillId, slug, name, cluster, state, new HashSet<>());
        }

        public SkillResult(UUID skillId, String slug, String name, String cluster, String state, Set<UUID> prerequisites) {
            this.skillId = skillId;
            this.slug = slug;
            this.name = name;
            this.cluster = cluster;
            this.state = state;
            this.prerequisites = prerequisites != null ? prerequisites : new HashSet<>();
        }

        public UUID getSkillId() { return skillId; }
        public void setSkillId(UUID skillId) { this.skillId = skillId; }
        public String getSlug() { return slug; }
        public void setSlug(String slug) { this.slug = slug; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getCluster() { return cluster; }
        public void setCluster(String cluster) { this.cluster = cluster; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        public Set<UUID> getPrerequisites() { return prerequisites; }
        public void setPrerequisites(Set<UUID> prerequisites) { this.prerequisites = prerequisites; }
    }

    /** Final result, only available once the assessment is COMPLETED. */
    public static class ResultView {
        private final UUID assessmentId;
        private final String level;   // BEGINNER, INTERMEDIATE or ADVANCED
        private final double theta;   // ability estimate
        private final int answered;
        private final int correct;
        private final List<SkillResult> skills;

        public ResultView(UUID assessmentId, String level, double theta,
                          int answered, int correct, List<SkillResult> skills) {
            this.assessmentId = assessmentId;
            this.level = level;
            this.theta = theta;
            this.answered = answered;
            this.correct = correct;
            this.skills = skills;
        }

        public UUID getAssessmentId() { return assessmentId; }
        public String getLevel() { return level; }
        public double getTheta() { return theta; }
        public int getAnswered() { return answered; }
        public int getCorrect() { return correct; }
        public List<SkillResult> getSkills() { return skills; }
    }

    /**
     * Breakdown of a single response in the final report.
     * Shows the question text, what the user answered, what was correct, and the skill tested.
     */
    public static class ResponseDetail {
        private final int seq;
        private final String questionStem;
        private final List<String> options;
        private final int selectedOption;
        private final int correctOption;
        private final boolean correct;
        /** Display text for the learner's chosen answer. */
        private final String yourAnswer;
        /** Display text for the correct answer. */
        private final String correctAnswer;
        /** Slug of the skill this question tests (may be null if not tagged). */
        private final String skillSlug;
        /** Display name of the skill (may be null if not tagged). */
        private final String skillName;

        public ResponseDetail(int seq, String questionStem, List<String> options,
                              int selectedOption, int correctOption, boolean correct,
                              String skillSlug, String skillName) {
            this.seq = seq;
            this.questionStem = questionStem;
            this.options = options;
            this.selectedOption = selectedOption;
            this.correctOption = correctOption;
            this.correct = correct;
            this.yourAnswer = (options != null && selectedOption >= 0 && selectedOption < options.size())
                    ? options.get(selectedOption) : null;
            this.correctAnswer = (options != null && correctOption >= 0 && correctOption < options.size())
                    ? options.get(correctOption) : null;
            this.skillSlug = skillSlug;
            this.skillName = skillName;
        }

        public int getSeq() { return seq; }
        public String getQuestionStem() { return questionStem; }
        public List<String> getOptions() { return options; }
        public int getSelectedOption() { return selectedOption; }
        public int getCorrectOption() { return correctOption; }
        public boolean isCorrect() { return correct; }
        public String getYourAnswer() { return yourAnswer; }
        public String getCorrectAnswer() { return correctAnswer; }
        public String getSkillSlug() { return skillSlug; }
        public String getSkillName() { return skillName; }
    }

    /**
     * Full assessment report — returned by GET /api/v1/assessments/{id}/report.
     * Includes a per-question breakdown plus the full skill graph state and which skills were unlocked.
     */
    public static class AssessmentReport {
        private final UUID assessmentId;
        private final String level;
        private final double initialTheta;
        private final double finalTheta;
        private final int answered;
        private final int correct;
        private final String stopReason;
        /** Per-question breakdown: question, user's answer, correct answer, skill tested. */
        private final List<ResponseDetail> responses;
        /** Full skill graph state (MASTERED / FRONTIER / LOCKED) for graph rendering. */
        private final List<SkillResult> skills;
        /**
         * Skills newly accessible (MASTERED or FRONTIER) as a result of this assessment.
         * The frontend should highlight/unlock these nodes in the graph.
         */
        private final List<SkillResult> unlockedSkills;

        public AssessmentReport(UUID assessmentId, String level, double initialTheta, double finalTheta,
                                int answered, int correct, String stopReason,
                                List<ResponseDetail> responses, List<SkillResult> skills,
                                List<SkillResult> unlockedSkills) {
            this.assessmentId = assessmentId;
            this.level = level;
            this.initialTheta = initialTheta;
            this.finalTheta = finalTheta;
            this.answered = answered;
            this.correct = correct;
            this.stopReason = stopReason;
            this.responses = responses;
            this.skills = skills;
            this.unlockedSkills = unlockedSkills;
        }

        public UUID getAssessmentId() { return assessmentId; }
        public String getLevel() { return level; }
        public double getInitialTheta() { return initialTheta; }
        public double getFinalTheta() { return finalTheta; }
        public int getAnswered() { return answered; }
        public int getCorrect() { return correct; }
        public String getStopReason() { return stopReason; }
        public List<ResponseDetail> getResponses() { return responses; }
        public List<SkillResult> getSkills() { return skills; }
        public List<SkillResult> getUnlockedSkills() { return unlockedSkills; }
    }
}

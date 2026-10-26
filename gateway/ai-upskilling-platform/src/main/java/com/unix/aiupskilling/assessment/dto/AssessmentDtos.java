package com.unix.aiupskilling.assessment.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

/**
 * Request and response shapes, as plain classes (getters/setters).
 * Questions never carry the correct answer or the difficulty values.
 */
public final class AssessmentDtos {

    private AssessmentDtos() {}

    // ---------- requests ----------

    /** Body of POST /api/v1/assessments. */
    public static class StartRequest {
        @NotNull
        private UUID trackId;

        public StartRequest() {}

        public StartRequest(UUID trackId) {
            this.trackId = trackId;
        }

        public UUID getTrackId() { return trackId; }
        public void setTrackId(UUID trackId) { this.trackId = trackId; }
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
        private String name;
        private String cluster;
        private String state;   // MASTERED, FRONTIER or LOCKED

        public SkillResult() {}

        public SkillResult(UUID skillId, String name, String cluster, String state) {
            this.skillId = skillId;
            this.name = name;
            this.cluster = cluster;
            this.state = state;
        }

        public UUID getSkillId() { return skillId; }
        public void setSkillId(UUID skillId) { this.skillId = skillId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getCluster() { return cluster; }
        public void setCluster(String cluster) { this.cluster = cluster; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
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
}

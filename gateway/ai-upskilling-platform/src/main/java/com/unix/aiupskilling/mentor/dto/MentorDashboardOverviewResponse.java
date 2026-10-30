package com.unix.aiupskilling.mentor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorDashboardOverviewResponse {

    private MentorSummary mentor;
    private CohortStats stats;
    private List<ProgressBucket> progressBuckets;
    private List<TopStudentDto> topStudents;
    private List<RecentAchievementDto> recentAchievements;
    private String mentorKey;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MentorSummary {
        private String id;
        private String fullName;
        private String avatarUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CohortStats {
        private long totalStudents;
        private long testsTaken;
        private long skillsAchieved;
        private long activeStudents;
        private int averageProgress;
        private int averageScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProgressBucket {
        private String band;
        private String label;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopStudentDto {
        private String id;
        private String name;
        private String username;
        private String avatarUrl;
        private int progress;
        private String progressLabel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentAchievementDto {
        private String id;
        private String studentId;
        private String studentName;
        private String skill;
        private String skillKey;
        private String category;
        private String proficiency;
        private Instant date;
    }
}


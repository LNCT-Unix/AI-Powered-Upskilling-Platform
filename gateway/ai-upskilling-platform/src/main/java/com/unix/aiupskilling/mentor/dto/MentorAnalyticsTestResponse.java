package com.unix.aiupskilling.mentor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorAnalyticsTestResponse {

    private AnalyticsTotals totals;
    private List<WeeklyActivityItem> weeklyActivity;
    private List<ProgressBandItem> progressBands;
    private List<StudentAnalyticsDto> students;
    private boolean truncated;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnalyticsTotals {
        private int testsTaken;
        private int completedTests;
        private int inProgressTests;
        private int averageScore;
        private int completionRate;
        private int averageDurationSeconds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklyActivityItem {
        private String date; // YYYY-MM-DD
        private String day;  // Mon, Tue, etc.
        private int value;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProgressBandItem {
        private String band;  // ADVANCED, ON_TRACK, NEEDS_ATTENTION
        private String label; // Advanced, On Track, Needs Attention
        private int count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAnalyticsDto {
        private String id;
        private String name;
        private String username;
        private String avatarUrl;
        private int testsTaken;
        private int averageScore;
        private int progress;
        private String progressLabel;
        private String progressBand;
    }
}


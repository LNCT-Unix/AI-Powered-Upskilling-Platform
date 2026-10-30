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
public class StudentDetailResponse {

    private StudentRowDto student;
    private List<StudentAchievementDto> achievements;
    private List<StudentTestHistoryDto> testHistory;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAchievementDto {
        private String id;
        private String skill;
        private String skillKey;
        private String category;
        private String proficiency;
        private int progress;
        private Instant date;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentTestHistoryDto {
        private String assessmentId;
        private String name;
        private Integer score; // null if in-progress
        private String status; // COMPLETED, IN_PROGRESS, ABANDONED
        private Instant date;
    }
}

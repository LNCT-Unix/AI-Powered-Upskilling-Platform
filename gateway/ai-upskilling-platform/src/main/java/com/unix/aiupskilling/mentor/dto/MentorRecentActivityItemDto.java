package com.unix.aiupskilling.mentor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorRecentActivityItemDto {
    private String id;
    private String studentId;
    private String studentName;
    private String assessmentId;
    private String testName;
    private Integer score;
    private String status;
    private Instant occurredAt;
}


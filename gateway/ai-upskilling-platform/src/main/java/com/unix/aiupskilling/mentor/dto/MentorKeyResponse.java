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
public class MentorKeyResponse {

    private String key;
    private String status;
    private Instant createdAt;
    private Instant rotatedAt;
    private long linkedStudentCount;
}


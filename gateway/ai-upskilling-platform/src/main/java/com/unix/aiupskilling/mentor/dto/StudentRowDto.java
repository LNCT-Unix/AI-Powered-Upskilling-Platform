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
public class StudentRowDto {

    private String id;
    private String name;
    private String username;
    private String email;
    private String avatarUrl;
    private long skillsAchieved;
    private long testsTaken;
    private int progress;
    private String progressLabel;
    private String progressBand;
    private boolean active;
    private Instant lastActiveAt;
    private double lastActiveDays;
    private int averageScore;
    private String track;
    private Instant joinedAt;
}

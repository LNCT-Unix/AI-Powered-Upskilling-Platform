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
public class AchievementRowDto {

    private String id;
    private String studentId;
    private String studentName;
    private String studentUsername;
    private String skill;
    private String skillKey;
    private String category;
    private String proficiency;
    private int progress;
    private Instant date;
}

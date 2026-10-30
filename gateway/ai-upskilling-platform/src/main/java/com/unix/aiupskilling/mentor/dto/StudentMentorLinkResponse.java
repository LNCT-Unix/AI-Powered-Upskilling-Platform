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
public class StudentMentorLinkResponse {

    private String mentorId;
    private String mentorName;
    private Instant linkedAt;
    private boolean alreadyLinked;
}


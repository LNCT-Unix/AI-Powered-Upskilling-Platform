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
public class MentorProfileResponse {

    private String id;
    private String fullName;
    private String username;
    private String email;
    private String role;
    private String mentorKey;
    private String title;
    private String bio;
    private List<String> expertise;
    private String location;
    private String avatarUrl;
    private boolean emailVerified;
    private Instant joinedAt;
}


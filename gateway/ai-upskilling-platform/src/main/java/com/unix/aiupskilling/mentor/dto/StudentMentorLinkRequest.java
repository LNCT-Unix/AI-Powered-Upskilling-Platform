package com.unix.aiupskilling.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentMentorLinkRequest {

    @NotBlank(message = "Mentor key is required")
    private String key;
}


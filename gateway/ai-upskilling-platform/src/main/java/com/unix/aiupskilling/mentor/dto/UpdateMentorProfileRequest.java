package com.unix.aiupskilling.mentor.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMentorProfileRequest {

    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @Pattern(regexp = "^[a-zA-Z0-9._]{3,24}$", message = "Use 3–24 letters, numbers, dots, or underscores.")
    private String username;

    @Size(max = 120, message = "Title cannot exceed 120 characters")
    private String title;

    @Size(max = 240, message = "Keep your bio under 240 characters.")
    private String bio;

    @Size(max = 12, message = "At most 12 expertise items are allowed.")
    private List<@Size(max = 40, message = "Each expertise item cannot exceed 40 characters") String> expertise;

    @Size(max = 120, message = "Location cannot exceed 120 characters")
    private String location;
}


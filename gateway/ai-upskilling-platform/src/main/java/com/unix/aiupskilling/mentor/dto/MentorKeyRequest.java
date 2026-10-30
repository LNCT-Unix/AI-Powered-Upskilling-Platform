package com.unix.aiupskilling.mentor.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorKeyRequest {

    @NotNull(message = "replaceExisting is required")
    private Boolean replaceExisting;
}


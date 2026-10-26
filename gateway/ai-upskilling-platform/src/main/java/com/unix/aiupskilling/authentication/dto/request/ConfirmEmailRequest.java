package com.unix.aiupskilling.authentication.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmEmailRequest {

    @NotBlank(message = "Token is required")
    @Size(max = 128, message = "Token cannot exceed 128 characters")
    private String token;
}

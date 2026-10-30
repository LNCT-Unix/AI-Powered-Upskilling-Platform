package com.unix.aiupskilling.authentication.dto.request;

import com.unix.aiupskilling.authentication.ValidPasswordLength;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorRegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Username is required")
    @Pattern(
            regexp = "^[a-zA-Z0-9._]{3,24}$",
            message = "Use 3–24 letters, numbers, dots, or underscores."
    )
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 254, message = "Email cannot exceed 254 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @ValidPasswordLength(min = 8, max = 72, message = "Password must be between 8 and 72 UTF-8 bytes")
    @ToString.Exclude
    private String password;

    @NotBlank(message = "Confirm password is required")
    @ToString.Exclude
    private String confirmPassword;
}


package com.unix.ai_upskilling_platform.authentication.dto.response;

import com.unix.ai_upskilling_platform.dto.response.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthTokens {

    private String accessToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private long expiresInSeconds;
    private String refreshToken;
    private UserResponse user;
}

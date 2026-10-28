package com.unix.aiupskilling.authentication.dto.response;

import com.unix.aiupskilling.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailVerificationResponse {

    private boolean emailVerified;
    private String accessToken;
    private String tokenType;
    private long expiresInSeconds;
    private String refreshToken;
    private UserResponse user;

    public static EmailVerificationResponse from(AuthTokens tokens) {
        return EmailVerificationResponse.builder()
                .emailVerified(true)
                .accessToken(tokens.getAccessToken())
                .tokenType(tokens.getTokenType())
                .expiresInSeconds(tokens.getExpiresInSeconds())
                .refreshToken(tokens.getRefreshToken())
                .user(tokens.getUser())
                .build();
    }
}

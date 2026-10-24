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
public class AuthTokensResponse {

    private String accessToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private long expiresInSeconds;
    private String refreshToken;
    private UserResponse user;

    public static AuthTokensResponse from(AuthTokens tokens) {
        return AuthTokensResponse.builder()
                .accessToken(tokens.getAccessToken())
                .tokenType(tokens.getTokenType())
                .expiresInSeconds(tokens.getExpiresInSeconds())
                .refreshToken(tokens.getRefreshToken())
                .user(tokens.getUser())
                .build();
    }
}

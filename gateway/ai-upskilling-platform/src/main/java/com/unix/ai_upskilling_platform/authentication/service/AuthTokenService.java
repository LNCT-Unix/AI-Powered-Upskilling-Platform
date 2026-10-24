package com.unix.ai_upskilling_platform.authentication.service;

import com.unix.ai_upskilling_platform.authentication.dto.response.AuthTokens;
import com.unix.ai_upskilling_platform.authentication.model.enums.ClientPlatform;
import com.unix.ai_upskilling_platform.model.entity.User;

public interface AuthTokenService {

    AuthTokens issueTokens(User user, ClientPlatform platform);

    AuthTokens refresh(String refreshToken, ClientPlatform platform);

    void revoke(String refreshToken);

    void revokeAllFor(Long userId);

    String createLoginCode(User user, ClientPlatform platform);

    AuthTokens exchangeLoginCode(String code);

    User parseAndValidateToken(String token);
}

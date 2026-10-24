package com.unix.aiupskilling.authentication.service;

import com.unix.aiupskilling.authentication.dto.response.AuthTokens;
import com.unix.aiupskilling.authentication.model.enums.ClientPlatform;
import com.unix.aiupskilling.user.User;

public interface AuthTokenService {

    AuthTokens issueTokens(User user, ClientPlatform platform);

    AuthTokens refresh(String refreshToken, ClientPlatform platform);

    void revoke(String refreshToken);

    void revokeAllFor(Long userId);

    String createLoginCode(User user, ClientPlatform platform);

    AuthTokens exchangeLoginCode(String code);

    User parseAndValidateToken(String token);
}

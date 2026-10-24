package com.unix.ai_upskilling_platform.authentication.service.impl;

import com.unix.ai_upskilling_platform.authentication.config.AuthProperties;
import com.unix.ai_upskilling_platform.authentication.model.entity.OAuthLinkIntent;
import com.unix.ai_upskilling_platform.authentication.model.enums.OAuthProvider;
import com.unix.ai_upskilling_platform.authentication.repository.OAuthLinkIntentRepository;
import com.unix.ai_upskilling_platform.authentication.service.OAuthLinkIntentService;
import com.unix.ai_upskilling_platform.authentication.util.TokenHashUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OAuthLinkIntentServiceImpl implements OAuthLinkIntentService {

    private final OAuthLinkIntentRepository oAuthLinkIntentRepository;
    private final AuthProperties authProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public String createIntent(Long userId, OAuthProvider provider) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String rawIntent = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String hash = TokenHashUtil.sha256(rawIntent);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(authProperties.getJwt().getLinkIntentTtlSeconds());

        OAuthLinkIntent intent = OAuthLinkIntent.builder()
                .userId(userId)
                .provider(provider)
                .intentHash(hash)
                .createdAt(now)
                .expiresAt(expiresAt)
                .build();

        oAuthLinkIntentRepository.save(intent);
        return rawIntent;
    }

    @Override
    @Transactional
    public Optional<Long> consumeIntent(String rawIntent, OAuthProvider provider) {
        if (rawIntent == null || rawIntent.isBlank() || provider == null) {
            return Optional.empty();
        }

        String hash = TokenHashUtil.sha256(rawIntent);
        Optional<OAuthLinkIntent> intentOpt = oAuthLinkIntentRepository.findByIntentHash(hash);

        if (intentOpt.isEmpty()) {
            return Optional.empty();
        }

        OAuthLinkIntent intent = intentOpt.get();
        if (!intent.isValid() || intent.getProvider() != provider) {
            return Optional.empty();
        }

        intent.setConsumedAt(LocalDateTime.now());
        oAuthLinkIntentRepository.save(intent);
        return Optional.of(intent.getUserId());
    }
}

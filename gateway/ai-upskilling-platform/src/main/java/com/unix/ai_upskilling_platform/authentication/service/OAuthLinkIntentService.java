package com.unix.ai_upskilling_platform.authentication.service;

import com.unix.ai_upskilling_platform.authentication.model.enums.OAuthProvider;

import java.util.Optional;

public interface OAuthLinkIntentService {

    String createIntent(Long userId, OAuthProvider provider);

    Optional<Long> consumeIntent(String rawIntent, OAuthProvider provider);
}

package com.unix.aiupskilling.authentication.service;

import com.unix.aiupskilling.authentication.model.enums.OAuthProvider;

import java.util.Optional;

public interface OAuthLinkIntentService {

    String createIntent(Long userId, OAuthProvider provider);

    Optional<Long> consumeIntent(String rawIntent, OAuthProvider provider);
}

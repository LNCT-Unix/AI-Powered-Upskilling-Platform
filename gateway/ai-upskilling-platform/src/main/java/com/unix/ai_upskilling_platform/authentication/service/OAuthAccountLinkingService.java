package com.unix.ai_upskilling_platform.authentication.service;

import com.unix.ai_upskilling_platform.authentication.model.OAuthIdentity;
import com.unix.ai_upskilling_platform.model.entity.User;

import java.util.Optional;

public interface OAuthAccountLinkingService {

    User resolve(OAuthIdentity identity, Optional<Long> linkIntentUserId);
}

package com.unix.aiupskilling.authentication.service;

import com.unix.aiupskilling.authentication.model.OAuthIdentity;
import com.unix.aiupskilling.user.User;

import java.util.Optional;

public interface OAuthAccountLinkingService {

    User resolve(OAuthIdentity identity, Optional<Long> linkIntentUserId);
}

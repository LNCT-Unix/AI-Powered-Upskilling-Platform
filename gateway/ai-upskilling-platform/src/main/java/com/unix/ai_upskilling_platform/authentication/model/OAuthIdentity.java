package com.unix.ai_upskilling_platform.authentication.model;

import com.unix.ai_upskilling_platform.authentication.model.enums.OAuthProvider;

public record OAuthIdentity(
        OAuthProvider provider,
        String subject,
        String email,
        boolean emailVerified,
        String displayName
) {
}

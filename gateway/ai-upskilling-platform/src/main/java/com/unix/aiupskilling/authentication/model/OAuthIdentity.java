package com.unix.aiupskilling.authentication.model;

import com.unix.aiupskilling.authentication.model.enums.OAuthProvider;

public record OAuthIdentity(
        OAuthProvider provider,
        String subject,
        String email,
        boolean emailVerified,
        String displayName
) {
}

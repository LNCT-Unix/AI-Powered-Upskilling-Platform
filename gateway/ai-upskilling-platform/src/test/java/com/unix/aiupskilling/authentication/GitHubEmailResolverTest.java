package com.unix.aiupskilling.authentication;

import com.unix.aiupskilling.authentication.security.oauth2.GitHubEmailResolver;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;

class GitHubEmailResolverTest {

    @Test
    @DisplayName("Null or blank access token returns Optional.empty()")
    void testBlankTokenReturnsEmpty() {
        GitHubEmailResolver resolver = new GitHubEmailResolver(RestClient.builder());
        assertThat(resolver.resolvePrimaryVerifiedEmail(null)).isEmpty();
        assertThat(resolver.resolvePrimaryVerifiedEmail("  ")).isEmpty();
    }
}

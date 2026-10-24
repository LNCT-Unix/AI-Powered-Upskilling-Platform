package com.unix.ai_upskilling_platform.authentication.security.oauth2;

import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Optional;

@Component
public class GitHubEmailResolver {

    private static final Logger log = LoggerFactory.getLogger(GitHubEmailResolver.class);
    private static final String GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

    private final RestClient restClient;

    public GitHubEmailResolver(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    public Optional<String> resolvePrimaryVerifiedEmail(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            return Optional.empty();
        }

        try {
            List<GitHubEmailDto> emails = restClient.get()
                    .uri(GITHUB_EMAILS_URL)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<GitHubEmailDto>>() {});

            if (emails == null || emails.isEmpty()) {
                return Optional.empty();
            }

            return emails.stream()
                    .filter(e -> e.isPrimary() && e.isVerified())
                    .map(GitHubEmailDto::getEmail)
                    .findFirst();
        } catch (Exception e) {
            log.error("Failed to fetch verified primary email from GitHub: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @Data
    public static class GitHubEmailDto {
        private String email;
        private boolean primary;
        private boolean verified;
        private String visibility;
    }
}

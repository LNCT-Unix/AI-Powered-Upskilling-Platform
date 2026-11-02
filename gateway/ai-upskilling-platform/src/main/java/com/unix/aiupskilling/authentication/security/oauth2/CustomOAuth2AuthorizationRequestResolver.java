package com.unix.aiupskilling.authentication.security.oauth2;

import com.unix.aiupskilling.authentication.config.AuthProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.net.URI;

public class CustomOAuth2AuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    public static final String OAUTH_CLIENT_PLATFORM_ATTR = "oauth_client_platform";
    public static final String OAUTH_FRONTEND_CALLBACK_ATTR = "oauth_frontend_callback_url";

    private final DefaultOAuth2AuthorizationRequestResolver defaultResolver;
    private final AuthProperties authProperties;

    public CustomOAuth2AuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository,
                                                    AuthProperties authProperties) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(clientRegistrationRepository, "/oauth2/authorization");
        this.authProperties = authProperties;
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request);
        processOAuthContext(request);
        return req;
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request, clientRegistrationId);
        processOAuthContext(request);
        return req;
    }

    private void processOAuthContext(HttpServletRequest request) {
        HttpSession session = request.getSession(true);

        String client = request.getParameter("client");
        if (client != null && ("web".equalsIgnoreCase(client) || "mobile".equalsIgnoreCase(client))) {
            session.setAttribute(OAUTH_CLIENT_PLATFORM_ATTR, client.toLowerCase());
        }

        String redirectUri = request.getParameter("redirect_uri");
        if (redirectUri == null || redirectUri.isBlank()) {
            String referer = request.getHeader("Referer");
            if (referer != null && !referer.isBlank()) {
                try {
                    URI refUri = URI.create(referer);
                    String origin = refUri.getScheme() + "://" + refUri.getAuthority();
                    redirectUri = origin + "/auth/callback";
                } catch (Exception ignored) {
                }
            }
        }

        if (redirectUri != null && isAllowedCallback(redirectUri)) {
            session.setAttribute(OAUTH_FRONTEND_CALLBACK_ATTR, redirectUri);
        }
    }

    private boolean isAllowedCallback(String uri) {
        try {
            URI parsed = URI.create(uri);
            String host = parsed.getHost();
            if (host == null) {
                return false;
            }
            if (host.equals("localhost") || host.equals("127.0.0.1")) {
                return true;
            }
            if (host.endsWith(".trycloudflare.com")) {
                return true;
            }
            if (host.equals("www.octobyte.space") || host.equals("octobyte.space")) {
                return true;
            }
            if (authProperties != null && authProperties.getCors() != null) {
                for (String allowed : authProperties.getCors().getAllowedOrigins()) {
                    if (uri.startsWith(allowed)) {
                        return true;
                    }
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}

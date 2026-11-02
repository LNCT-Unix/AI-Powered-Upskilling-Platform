package com.unix.aiupskilling.authentication.security.oauth2;

import com.unix.aiupskilling.authentication.config.AuthProperties;
import com.unix.aiupskilling.authentication.exception.OAuthLoginException;
import com.unix.aiupskilling.authentication.model.enums.ClientPlatform;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;

@Component
@RequiredArgsConstructor
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2LoginFailureHandler.class);

    private final AuthProperties authProperties;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {

        String errorCode = mapErrorCode(exception);
        log.warn("OAuth2 authentication failure: code={}, message={}", errorCode, exception.getMessage());

        ClientPlatform platform = resolvePlatform(request);

        HttpSession session = request.getSession(false);
        String errorUrl = null;
        if (platform != ClientPlatform.MOBILE && session != null) {
            String callbackUrl = (String) session.getAttribute(CustomOAuth2AuthorizationRequestResolver.OAUTH_FRONTEND_CALLBACK_ATTR);
            if (callbackUrl != null && !callbackUrl.isBlank()) {
                try {
                    URI uri = URI.create(callbackUrl);
                    errorUrl = uri.getScheme() + "://" + uri.getAuthority() + "/auth/error";
                } catch (Exception ignored) {
                }
            }
        }

        if (errorUrl == null || errorUrl.isBlank()) {
            errorUrl = (platform == ClientPlatform.MOBILE)
                    ? authProperties.getFrontend().getMobileErrorUrl()
                    : authProperties.getFrontend().getWebErrorUrl();
        }

        String delimiter = errorUrl.contains("?") ? "&" : "?";
        String targetUrl = errorUrl + delimiter + "error=" + errorCode;

        OAuthCookieHelper.clearCookie(request, response, OAuthCookieHelper.LINK_INTENT_COOKIE, "/");

        if (session != null) {
            session.invalidate();
        }

        log.info("Redirecting OAuth2 failure to: {}", targetUrl);
        response.sendRedirect(targetUrl);
    }

    private String mapErrorCode(AuthenticationException ex) {
        if (ex instanceof OAuthLoginException ole) {
            return ole.getCode();
        }
        Throwable cause = ex.getCause();
        if (cause instanceof OAuthLoginException ole) {
            return ole.getCode();
        }
        String msg = (ex.getMessage() != null) ? ex.getMessage().toLowerCase() : "";
        if (msg.contains("account_already_linked")) {
            return "ACCOUNT_ALREADY_LINKED";
        }
        if (msg.contains("duplicate_email") || msg.contains("email already exists")) {
            return "DUPLICATE_EMAIL";
        }
        if (msg.contains("provider_user_id_conflict")) {
            return "PROVIDER_CONFLICT";
        }
        if (msg.contains("access_denied")) {
            return "ACCESS_DENIED";
        }
        if (msg.contains("invalid_token") || msg.contains("token_rejected")) {
            return "TOKEN_REJECTED";
        }
        return "OAUTH_LOGIN_FAILED";
    }

    private ClientPlatform resolvePlatform(HttpServletRequest request) {
        String client = request.getParameter("client");
        if (client == null) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                client = (String) session.getAttribute(CustomOAuth2AuthorizationRequestResolver.OAUTH_CLIENT_PLATFORM_ATTR);
            }
        }
        if ("mobile".equalsIgnoreCase(client)) {
            return ClientPlatform.MOBILE;
        }
        return ClientPlatform.WEB;
    }
}

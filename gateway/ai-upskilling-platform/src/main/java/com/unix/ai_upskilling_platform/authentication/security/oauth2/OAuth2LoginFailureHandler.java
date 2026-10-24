package com.unix.ai_upskilling_platform.authentication.security.oauth2;

import com.unix.ai_upskilling_platform.authentication.config.AuthProperties;
import com.unix.ai_upskilling_platform.authentication.exception.OAuthLoginException;
import com.unix.ai_upskilling_platform.authentication.model.enums.ClientPlatform;
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
        String errorUrl = (platform == ClientPlatform.MOBILE)
                ? authProperties.getFrontend().getMobileErrorUrl()
                : authProperties.getFrontend().getWebErrorUrl();

        String delimiter = errorUrl.contains("?") ? "&" : "?";
        String targetUrl = errorUrl + delimiter + "error=" + errorCode;

        OAuthCookieHelper.clearCookie(response, OAuthCookieHelper.LINK_INTENT_COOKIE, "/");

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

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
        if (msg.contains("access_denied") || msg.contains("consent") || msg.contains("user cancelled")) {
            return "OAUTH_ACCESS_DENIED";
        }
        return "OAUTH_PROVIDER_ERROR";
    }

    private ClientPlatform resolvePlatform(HttpServletRequest request) {
        String client = request.getParameter("client");
        if (client == null) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                client = (String) session.getAttribute("oauth_client_platform");
            }
        }
        if ("mobile".equalsIgnoreCase(client)) {
            return ClientPlatform.MOBILE;
        }
        return ClientPlatform.WEB;
    }
}

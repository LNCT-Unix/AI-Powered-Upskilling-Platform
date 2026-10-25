package com.unix.aiupskilling.authentication.security.oauth2;

import com.unix.aiupskilling.authentication.config.AuthProperties;
import com.unix.aiupskilling.authentication.model.enums.ClientPlatform;
import com.unix.aiupskilling.authentication.service.AuthTokenService;
import com.unix.aiupskilling.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);

    private final AuthTokenService authTokenService;
    private final AuthProperties authProperties;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuthUserPrincipal principal = (OAuthUserPrincipal) authentication.getPrincipal();
        User user = principal.getUser();

        ClientPlatform platform = resolvePlatform(request);
        String code = authTokenService.createLoginCode(user, platform);

        String callbackUrl = (platform == ClientPlatform.MOBILE)
                ? authProperties.getFrontend().getMobileCallbackUrl()
                : authProperties.getFrontend().getWebCallbackUrl();

        String delimiter = callbackUrl.contains("?") ? "&" : "?";
        String targetUrl = callbackUrl + delimiter + "code=" + code;

        OAuthCookieHelper.clearCookie(response, OAuthCookieHelper.LINK_INTENT_COOKIE, "/");

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        log.info("OAuth2 login successful for userId={}. Redirecting to target frontend.", user.getId());
        response.sendRedirect(targetUrl);
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

package com.unix.ai_upskilling_platform.authentication.security.oauth2;

import com.unix.ai_upskilling_platform.authentication.model.OAuthIdentity;
import com.unix.ai_upskilling_platform.authentication.model.enums.OAuthProvider;
import com.unix.ai_upskilling_platform.authentication.service.OAuthAccountLinkingService;
import com.unix.ai_upskilling_platform.authentication.service.OAuthLinkIntentService;
import com.unix.ai_upskilling_platform.model.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GoogleOidcUserService extends OidcUserService {

    private final OAuthAccountLinkingService oauthAccountLinkingService;
    private final OAuthLinkIntentService oauthLinkIntentService;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        String subject = oidcUser.getSubject();
        String email = oidcUser.getEmail();
        Boolean emailVerified = oidcUser.getEmailVerified();
        String name = oidcUser.getFullName();

        OAuthIdentity identity = new OAuthIdentity(
                OAuthProvider.GOOGLE,
                subject,
                email,
                Boolean.TRUE.equals(emailVerified),
                name
        );

        Optional<Long> linkIntentUserId = resolveLinkIntent(OAuthProvider.GOOGLE);

        User user = oauthAccountLinkingService.resolve(identity, linkIntentUserId);
        return new OAuthUserPrincipal(user, oidcUser);
    }

    private Optional<Long> resolveLinkIntent(OAuthProvider provider) {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            return Optional.empty();
        }
        HttpServletRequest request = attrs.getRequest();
        return OAuthCookieHelper.getCookieValue(request, OAuthCookieHelper.LINK_INTENT_COOKIE)
                .flatMap(rawIntent -> oauthLinkIntentService.consumeIntent(rawIntent, provider));
    }
}

package com.unix.ai_upskilling_platform.authentication.security.oauth2;

import com.unix.ai_upskilling_platform.authentication.model.OAuthIdentity;
import com.unix.ai_upskilling_platform.authentication.model.enums.OAuthProvider;
import com.unix.ai_upskilling_platform.authentication.service.OAuthAccountLinkingService;
import com.unix.ai_upskilling_platform.authentication.service.OAuthLinkIntentService;
import com.unix.ai_upskilling_platform.model.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GitHubOAuth2UserService extends DefaultOAuth2UserService {

    private final GitHubEmailResolver gitHubEmailResolver;
    private final OAuthAccountLinkingService oauthAccountLinkingService;
    private final OAuthLinkIntentService oauthLinkIntentService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        Object idObj = oauth2User.getAttributes().get("id");
        if (idObj == null) {
            throw new OAuth2AuthenticationException("GitHub user ID not present");
        }
        String subject = String.valueOf(idObj);

        String name = (String) oauth2User.getAttributes().get("name");
        if (name == null || name.isBlank()) {
            name = (String) oauth2User.getAttributes().get("login");
        }

        String tokenValue = userRequest.getAccessToken().getTokenValue();
        Optional<String> primaryVerifiedEmailOpt = gitHubEmailResolver.resolvePrimaryVerifiedEmail(tokenValue);

        String email = primaryVerifiedEmailOpt.orElse(null);
        boolean emailVerified = primaryVerifiedEmailOpt.isPresent();

        OAuthIdentity identity = new OAuthIdentity(
                OAuthProvider.GITHUB,
                subject,
                email,
                emailVerified,
                name
        );

        Optional<Long> linkIntentUserId = resolveLinkIntent(OAuthProvider.GITHUB);

        User user = oauthAccountLinkingService.resolve(identity, linkIntentUserId);
        return new OAuthUserPrincipal(user, oauth2User);
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

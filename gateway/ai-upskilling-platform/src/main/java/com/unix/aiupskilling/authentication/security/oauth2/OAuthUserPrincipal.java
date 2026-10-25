package com.unix.aiupskilling.authentication.security.oauth2;

import com.unix.aiupskilling.user.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.List;
import java.util.Map;

@Getter
public class OAuthUserPrincipal implements OAuth2User, OidcUser {

    private final User user;
    private final Map<String, Object> attributes;
    private final Map<String, Object> claims;
    private final OidcUserInfo userInfo;
    private final OidcIdToken idToken;

    public OAuthUserPrincipal(User user, OAuth2User oauth2User) {
        this.user = user;
        this.attributes = oauth2User.getAttributes();
        if (oauth2User instanceof OidcUser oidcUser) {
            this.claims = oidcUser.getClaims();
            this.userInfo = oidcUser.getUserInfo();
            this.idToken = oidcUser.getIdToken();
        } else {
            this.claims = Map.of();
            this.userInfo = null;
            this.idToken = null;
        }
    }

    public Long getUserId() {
        return user.getId();
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override
    public String getName() {
        return String.valueOf(user.getId());
    }

    @Override
    public Map<String, Object> getClaims() {
        return claims;
    }

    @Override
    public OidcUserInfo getUserInfo() {
        return userInfo;
    }

    @Override
    public OidcIdToken getIdToken() {
        return idToken;
    }
}

package com.unix.aiupskilling.authentication.security.oauth2;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

import java.util.Optional;

public final class OAuthCookieHelper {

    public static final String LINK_INTENT_COOKIE = "oauth_link_intent";
    public static final String REFRESH_TOKEN_COOKIE = "refresh_token";

    private OAuthCookieHelper() {
    }

    public static Optional<String> getCookieValue(HttpServletRequest request, String name) {
        if (request == null || request.getCookies() == null) {
            return Optional.empty();
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return Optional.ofNullable(cookie.getValue());
            }
        }
        return Optional.empty();
    }

    public static boolean isSecureRequest(HttpServletRequest request) {
        if (request == null) {
            return false;
        }
        if (request.isSecure()) {
            return true;
        }
        String proto = request.getHeader("X-Forwarded-Proto");
        if ("https".equalsIgnoreCase(proto)) {
            return true;
        }
        String ssl = request.getHeader("X-Forwarded-Ssl");
        if ("on".equalsIgnoreCase(ssl)) {
            return true;
        }
        String origin = request.getHeader("Origin");
        if (origin != null && origin.startsWith("https://")) {
            return true;
        }
        String referer = request.getHeader("Referer");
        if (referer != null && referer.startsWith("https://")) {
            return true;
        }
        return false;
    }

    public static void clearCookie(HttpServletResponse response, String name, String path) {
        clearCookie(null, response, name, path);
    }

    public static void clearCookie(HttpServletRequest request, HttpServletResponse response, String name, String path) {
        boolean isSecure = isSecureRequest(request);
        ResponseCookie cookie = ResponseCookie.from(name, "")
                .path(path)
                .maxAge(0)
                .httpOnly(true)
                .secure(isSecure)
                .sameSite(isSecure ? "None" : "Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public static void setCookie(HttpServletResponse response, String name, String value, String path, long maxAgeSeconds) {
        setCookie(null, response, name, value, path, maxAgeSeconds);
    }

    public static void setCookie(HttpServletRequest request, HttpServletResponse response, String name, String value, String path, long maxAgeSeconds) {
        boolean isSecure = isSecureRequest(request);
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .path(path)
                .maxAge(maxAgeSeconds)
                .httpOnly(true)
                .secure(isSecure)
                .sameSite(isSecure ? "None" : "Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}

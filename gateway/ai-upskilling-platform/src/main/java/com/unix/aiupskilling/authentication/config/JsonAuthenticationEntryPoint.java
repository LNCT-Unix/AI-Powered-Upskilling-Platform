package com.unix.aiupskilling.authentication.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        String body = String.format(
                "{\"success\":false,\"message\":\"Full authentication is required to access this resource\",\"data\":{\"code\":\"UNAUTHORIZED\"},\"timestamp\":\"%s\"}",
                LocalDateTime.now()
        );
        response.getWriter().write(body);
    }
}

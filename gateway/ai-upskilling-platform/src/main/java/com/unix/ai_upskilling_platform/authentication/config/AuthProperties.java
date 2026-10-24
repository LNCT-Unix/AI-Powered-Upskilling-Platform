package com.unix.ai_upskilling_platform.authentication.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.auth")
public class AuthProperties {

    private JwtProperties jwt = new JwtProperties();
    private FrontendProperties frontend = new FrontendProperties();
    private CorsProperties cors = new CorsProperties();

    @Data
    public static class JwtProperties {
        private String secret = "default-insecure-secret-for-development-only-min-32-chars";
        private long accessTokenTtlSeconds = 900;
        private long refreshTokenTtlSeconds = 2592000;
        private long loginCodeTtlSeconds = 60;
        private long linkIntentTtlSeconds = 300;
        private String issuer = "ai-upskilling-platform";
    }

    @Data
    public static class FrontendProperties {
        private String webCallbackUrl = "http://localhost:5173/auth/callback";
        private String mobileCallbackUrl = "myapp://auth/callback";
        private String webErrorUrl = "http://localhost:5173/auth/error";
        private String mobileErrorUrl = "myapp://auth/error";
    }

    @Data
    public static class CorsProperties {
        private List<String> allowedOrigins = new ArrayList<>(List.of("http://localhost:5173", "http://localhost:3000"));
    }
}

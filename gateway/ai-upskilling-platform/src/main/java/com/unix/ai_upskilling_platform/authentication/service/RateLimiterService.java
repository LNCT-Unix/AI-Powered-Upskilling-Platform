package com.unix.ai_upskilling_platform.authentication.service;

import com.unix.ai_upskilling_platform.authentication.config.AuthProperties;
import com.unix.ai_upskilling_platform.authentication.exception.RateLimitExceededException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class RateLimiterService {

    private final AuthProperties authProperties;

    // IP -> deque of request timestamps for register/resend
    private final Map<String, Deque<Instant>> ipRegisterResendTimestamps = new ConcurrentHashMap<>();

    // IP+Email -> deque of failed login timestamps
    private final Map<String, Deque<Instant>> failedLoginTimestamps = new ConcurrentHashMap<>();

    private static final int MAX_FAILED_LOGINS = 10;
    private static final long FAILED_LOGIN_WINDOW_SECONDS = 900; // 15 minutes
    private static final long IP_WINDOW_SECONDS = 3600; // 1 hour

    public void checkRegisterResendIpLimit(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            return;
        }

        int maxPerHour = authProperties.getVerification().getIpMaxPerHour();
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(IP_WINDOW_SECONDS);

        Deque<Instant> timestamps = ipRegisterResendTimestamps.computeIfAbsent(clientIp, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            cleanOldTimestamps(timestamps, cutoff);
            if (timestamps.size() >= maxPerHour) {
                throw new RateLimitExceededException("Too many requests from this IP", "RATE_LIMITED");
            }
            timestamps.addLast(now);
        }
    }

    public void checkLoginRateLimit(String clientIp, String email) {
        String key = buildLoginKey(clientIp, email);
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(FAILED_LOGIN_WINDOW_SECONDS);

        Deque<Instant> timestamps = failedLoginTimestamps.get(key);
        if (timestamps != null) {
            synchronized (timestamps) {
                cleanOldTimestamps(timestamps, cutoff);
                if (timestamps.size() >= MAX_FAILED_LOGINS) {
                    throw new RateLimitExceededException("Too many failed login attempts. Please try again later.", "RATE_LIMITED");
                }
            }
        }
    }

    public void recordFailedLogin(String clientIp, String email) {
        String key = buildLoginKey(clientIp, email);
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(FAILED_LOGIN_WINDOW_SECONDS);

        Deque<Instant> timestamps = failedLoginTimestamps.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            cleanOldTimestamps(timestamps, cutoff);
            timestamps.addLast(now);
        }
    }

    public void resetFailedLogin(String clientIp, String email) {
        String key = buildLoginKey(clientIp, email);
        failedLoginTimestamps.remove(key);
    }

    private void cleanOldTimestamps(Deque<Instant> timestamps, Instant cutoff) {
        while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
            timestamps.pollFirst();
        }
    }

    private String buildLoginKey(String clientIp, String email) {
        String ip = (clientIp != null) ? clientIp.trim() : "unknown";
        String em = (email != null) ? email.trim().toLowerCase() : "unknown";
        return ip + ":" + em;
    }
}

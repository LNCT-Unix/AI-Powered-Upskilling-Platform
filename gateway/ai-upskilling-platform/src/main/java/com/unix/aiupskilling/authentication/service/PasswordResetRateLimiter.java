package com.unix.aiupskilling.authentication.service;

import com.unix.aiupskilling.authentication.exception.RateLimitExceededException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PasswordResetRateLimiter {

    public static final int MAX_REQUESTS_PER_WINDOW = 3;
    public static final long WINDOW_SECONDS = 900; // 15 minutes
    public static final long COOLDOWN_SECONDS = 60; // 60 seconds

    // Key -> queue of request timestamps
    private final Map<String, Deque<Instant>> ipTimestamps = new ConcurrentHashMap<>();
    private final Map<String, Deque<Instant>> emailTimestamps = new ConcurrentHashMap<>();

    public void checkLimit(String clientIp, String normalizedEmail) {
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(WINDOW_SECONDS);

        // 1. IP rate limit check (3 requests / 15 minutes)
        if (clientIp != null && !clientIp.isBlank()) {
            Deque<Instant> ipQueue = ipTimestamps.get(clientIp.trim());
            if (ipQueue != null) {
                synchronized (ipQueue) {
                    cleanOldTimestamps(ipQueue, cutoff);
                    if (ipQueue.size() >= MAX_REQUESTS_PER_WINDOW) {
                        throw new RateLimitExceededException(
                                "Too many password reset requests from this IP. Please try again after 15 minutes.",
                                "RATE_LIMITED"
                        );
                    }
                }
            }
        }

        // 2. Email rate limit check (3 requests / 15 minutes)
        if (normalizedEmail != null && !normalizedEmail.isBlank()) {
            Deque<Instant> emailQueue = emailTimestamps.get(normalizedEmail.trim().toLowerCase());
            if (emailQueue != null) {
                synchronized (emailQueue) {
                    cleanOldTimestamps(emailQueue, cutoff);
                    if (emailQueue.size() >= MAX_REQUESTS_PER_WINDOW) {
                        throw new RateLimitExceededException(
                                "Too many password reset requests for this account. Please try again after 15 minutes.",
                                "RATE_LIMITED"
                        );
                    }
                }
            }
        }
    }

    public void recordRequest(String clientIp, String normalizedEmail) {
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(WINDOW_SECONDS);

        if (clientIp != null && !clientIp.isBlank()) {
            Deque<Instant> ipQueue = ipTimestamps.computeIfAbsent(clientIp.trim(), k -> new ArrayDeque<>());
            synchronized (ipQueue) {
                cleanOldTimestamps(ipQueue, cutoff);
                ipQueue.addLast(now);
            }
        }

        if (normalizedEmail != null && !normalizedEmail.isBlank()) {
            Deque<Instant> emailQueue = emailTimestamps.computeIfAbsent(normalizedEmail.trim().toLowerCase(), k -> new ArrayDeque<>());
            synchronized (emailQueue) {
                cleanOldTimestamps(emailQueue, cutoff);
                emailQueue.addLast(now);
            }
        }
    }

    private void cleanOldTimestamps(Deque<Instant> timestamps, Instant cutoff) {
        while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
            timestamps.pollFirst();
        }
    }
}

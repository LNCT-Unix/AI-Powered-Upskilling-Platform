package com.unix.aiupskilling.mentor.util;

import java.security.SecureRandom;

public final class MentorKeyGenerator {

    public static final String PREFIX = "MENTOR-";
    public static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    public static final int KEY_LENGTH = 6;
    public static final String KEY_REGEX = "^MENTOR-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$";

    private static final SecureRandom RANDOM = new SecureRandom();

    private MentorKeyGenerator() {
    }

    public static String generateKey() {
        StringBuilder sb = new StringBuilder(PREFIX);
        for (int i = 0; i < KEY_LENGTH; i++) {
            int index = RANDOM.nextInt(ALPHABET.length());
            sb.append(ALPHABET.charAt(index));
        }
        return sb.toString();
    }

    public static boolean isValidFormat(String key) {
        return key != null && key.matches(KEY_REGEX);
    }
}


package com.unix.aiupskilling.mentor.service.impl;

import com.unix.aiupskilling.authentication.service.RateLimiterService;
import com.unix.aiupskilling.mentor.dto.MentorKeyResponse;
import com.unix.aiupskilling.mentor.exception.MentorKeyAlreadyExistsException;
import com.unix.aiupskilling.mentor.model.entity.MentorKey;
import com.unix.aiupskilling.mentor.model.enums.MentorKeyStatus;
import com.unix.aiupskilling.mentor.repository.MentorKeyRepository;
import com.unix.aiupskilling.mentor.repository.MentorStudentLinkRepository;
import com.unix.aiupskilling.mentor.service.MentorKeyService;
import com.unix.aiupskilling.mentor.util.MentorKeyGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MentorKeyServiceImpl implements MentorKeyService {

    private final MentorKeyRepository mentorKeyRepository;
    private final MentorStudentLinkRepository mentorStudentLinkRepository;
    private final RateLimiterService rateLimiterService;

    private static final int MAX_KEY_GENERATION_ATTEMPTS = 10;

    @Override
    @Transactional(readOnly = true)
    public Optional<MentorKeyResponse> getActiveKey(Long mentorUserId) {
        if (mentorUserId == null) {
            return Optional.empty();
        }

        return mentorKeyRepository.findByMentorUserIdAndStatus(mentorUserId, MentorKeyStatus.ACTIVE)
                .map(key -> mapToResponse(key, mentorUserId));
    }

    @Override
    @Transactional
    public MentorKeyResponse generateOrReplaceKey(Long mentorUserId, boolean replaceExisting) {
        if (mentorUserId == null) {
            throw new IllegalArgumentException("Mentor user id cannot be null");
        }

        rateLimiterService.checkKeyRotationLimit(mentorUserId);

        Optional<MentorKey> activeKeyOpt = mentorKeyRepository.findByMentorUserIdAndStatus(mentorUserId, MentorKeyStatus.ACTIVE);

        UUID rotatedFromId = null;
        Instant now = Instant.now();

        if (activeKeyOpt.isPresent()) {
            MentorKey existingKey = activeKeyOpt.get();
            if (!replaceExisting) {
                throw new MentorKeyAlreadyExistsException(
                        "An active mentor key already exists.",
                        existingKey.getKeyValue(),
                        existingKey.getCreatedAt()
                );
            }

            // Revoke the existing key atomically
            existingKey.setStatus(MentorKeyStatus.REVOKED);
            existingKey.setRevokedAt(now);
            mentorKeyRepository.save(existingKey);
            rotatedFromId = existingKey.getId();
        }

        // Generate a new unique key
        String newKeyValue = generateUniqueKey();

        MentorKey newKey = MentorKey.builder()
                .mentorUserId(mentorUserId)
                .keyValue(newKeyValue)
                .status(MentorKeyStatus.ACTIVE)
                .createdAt(now)
                .rotatedFromId(rotatedFromId)
                .build();

        newKey = mentorKeyRepository.save(newKey);

        return mapToResponse(newKey, mentorUserId);
    }

    private String generateUniqueKey() {
        for (int i = 0; i < MAX_KEY_GENERATION_ATTEMPTS; i++) {
            String candidate = MentorKeyGenerator.generateKey();
            if (!mentorKeyRepository.existsByKeyValue(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Failed to generate a unique mentor key after " + MAX_KEY_GENERATION_ATTEMPTS + " attempts.");
    }

    private MentorKeyResponse mapToResponse(MentorKey key, Long mentorUserId) {
        long linkedStudentCount = mentorStudentLinkRepository.countByMentorUserIdAndUnlinkedAtIsNull(mentorUserId);
        Instant rotatedAt = (key.getRotatedFromId() != null) ? key.getCreatedAt() : null;

        return MentorKeyResponse.builder()
                .key(key.getKeyValue())
                .status(key.getStatus().name())
                .createdAt(key.getCreatedAt())
                .rotatedAt(rotatedAt)
                .linkedStudentCount(linkedStudentCount)
                .build();
    }
}


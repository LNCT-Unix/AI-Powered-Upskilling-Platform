package com.unix.aiupskilling.mentor.service.impl;

import com.unix.aiupskilling.authentication.service.RateLimiterService;
import com.unix.aiupskilling.mentor.dto.StudentMentorLinkResponse;
import com.unix.aiupskilling.mentor.exception.InvalidMentorKeyException;
import com.unix.aiupskilling.mentor.exception.StudentAlreadyLinkedException;
import com.unix.aiupskilling.mentor.model.entity.MentorKey;
import com.unix.aiupskilling.mentor.model.entity.MentorStudentLink;
import com.unix.aiupskilling.mentor.model.enums.MentorKeyStatus;
import com.unix.aiupskilling.mentor.repository.MentorKeyRepository;
import com.unix.aiupskilling.mentor.repository.MentorStudentLinkRepository;
import com.unix.aiupskilling.mentor.service.StudentMentorLinkService;
import com.unix.aiupskilling.mentor.util.MentorKeyGenerator;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StudentMentorLinkServiceImpl implements StudentMentorLinkService {

    private final MentorKeyRepository mentorKeyRepository;
    private final MentorStudentLinkRepository mentorStudentLinkRepository;
    private final UserRepository userRepository;
    private final RateLimiterService rateLimiterService;

    @Override
    @Transactional
    public StudentMentorLinkResponse linkStudentToMentor(Long studentUserId, String rawKey, String clientIp) {
        if (studentUserId == null) {
            throw new IllegalArgumentException("Student user id cannot be null");
        }

        rateLimiterService.checkKeyRedemptionLimit(studentUserId, clientIp);

        String trimmedKey = (rawKey != null) ? rawKey.trim().toUpperCase() : "";

        if (!MentorKeyGenerator.isValidFormat(trimmedKey)) {
            throw new InvalidMentorKeyException("That mentor key is not valid.");
        }

        MentorKey key = mentorKeyRepository.findByKeyValueAndStatus(trimmedKey, MentorKeyStatus.ACTIVE)
                .orElseThrow(() -> new InvalidMentorKeyException("That mentor key is not valid."));

        User mentor = userRepository.findById(key.getMentorUserId())
                .orElseThrow(() -> new InvalidMentorKeyException("That mentor key is not valid."));

        // Check if student is already linked to any active mentor
        Optional<MentorStudentLink> existingLinkOpt = mentorStudentLinkRepository.findByStudentUserIdAndUnlinkedAtIsNull(studentUserId);

        if (existingLinkOpt.isPresent()) {
            MentorStudentLink existingLink = existingLinkOpt.get();
            // Already linked to the same mentor -> Idempotent 200 OK
            if (existingLink.getMentorUserId().equals(mentor.getId())) {
                return StudentMentorLinkResponse.builder()
                        .mentorId(String.valueOf(mentor.getId()))
                        .mentorName(mentor.getFullName())
                        .linkedAt(existingLink.getLinkedAt())
                        .alreadyLinked(true)
                        .build();
            }

            // Already linked to a different mentor -> 409 Conflict
            User currentMentor = userRepository.findById(existingLink.getMentorUserId()).orElse(null);
            String currentMentorName = (currentMentor != null && currentMentor.getFullName() != null)
                    ? currentMentor.getFullName()
                    : "Another Mentor";

            throw new StudentAlreadyLinkedException("You are already linked to a mentor.", currentMentorName);
        }

        // Link student to this mentor
        Instant now = Instant.now();
        MentorStudentLink link = MentorStudentLink.builder()
                .mentorUserId(mentor.getId())
                .studentUserId(studentUserId)
                .keyId(key.getId())
                .linkedAt(now)
                .build();

        mentorStudentLinkRepository.save(link);

        return StudentMentorLinkResponse.builder()
                .mentorId(String.valueOf(mentor.getId()))
                .mentorName(mentor.getFullName())
                .linkedAt(now)
                .alreadyLinked(false)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public StudentMentorLinkResponse getStudentMentor(Long studentUserId) {
        if (studentUserId == null) {
            return null;
        }

        return mentorStudentLinkRepository.findByStudentUserIdAndUnlinkedAtIsNull(studentUserId)
                .map(link -> {
                    User mentor = userRepository.findById(link.getMentorUserId()).orElse(null);
                    return StudentMentorLinkResponse.builder()
                            .mentorId(String.valueOf(link.getMentorUserId()))
                            .mentorName(mentor != null ? mentor.getFullName() : "Mentor")
                            .linkedAt(link.getLinkedAt())
                            .alreadyLinked(true)
                            .build();
                })
                .orElse(null);
    }

    @Override
    @Transactional
    public void unlinkStudentFromMentor(Long studentUserId) {
        if (studentUserId == null) {
            return;
        }

        mentorStudentLinkRepository.findByStudentUserIdAndUnlinkedAtIsNull(studentUserId)
                .ifPresent(link -> {
                    link.setUnlinkedAt(Instant.now());
                    mentorStudentLinkRepository.save(link);
                });
    }
}


package com.unix.aiupskilling.mentor.service.impl;

import com.unix.aiupskilling.authentication.exception.UsernameAlreadyTakenException;
import com.unix.aiupskilling.mentor.dto.MentorProfileResponse;
import com.unix.aiupskilling.mentor.dto.UpdateMentorProfileRequest;
import com.unix.aiupskilling.mentor.model.entity.MentorKey;
import com.unix.aiupskilling.mentor.model.entity.MentorProfile;
import com.unix.aiupskilling.mentor.model.enums.MentorKeyStatus;
import com.unix.aiupskilling.mentor.repository.MentorKeyRepository;
import com.unix.aiupskilling.mentor.repository.MentorProfileRepository;
import com.unix.aiupskilling.mentor.service.MentorProfileService;
import com.unix.aiupskilling.shared.exception.ResourceNotFoundException;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MentorProfileServiceImpl implements MentorProfileService {

    private final UserRepository userRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentorKeyRepository mentorKeyRepository;

    @Override
    @Transactional(readOnly = true)
    public MentorProfileResponse getProfile(Long mentorUserId) {
        User user = findMentorUser(mentorUserId);
        MentorProfile profile = getOrCreateProfile(user);
        String activeKey = getActiveKeyString(mentorUserId);

        return mapToResponse(user, profile, activeKey);
    }

    @Override
    @Transactional
    public MentorProfileResponse updateProfile(Long mentorUserId, UpdateMentorProfileRequest request) {
        User user = findMentorUser(mentorUserId);
        MentorProfile profile = getOrCreateProfile(user);

        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            String trimmedUsername = request.getUsername().trim().toLowerCase();
            if (user.getUsername() == null || !user.getUsername().equalsIgnoreCase(trimmedUsername)) {
                if (userRepository.existsByUsernameIgnoreCase(trimmedUsername)) {
                    throw new UsernameAlreadyTakenException("That username is already taken.");
                }
                user.setUsername(trimmedUsername);
            }
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getBio() != null) {
            user.setBio(request.getBio().trim());
        }

        userRepository.save(user);

        if (request.getTitle() != null) {
            profile.setTitle(request.getTitle().trim());
        }

        if (request.getLocation() != null) {
            profile.setLocation(request.getLocation().trim());
        }

        if (request.getExpertise() != null) {
            Set<String> deduplicated = new LinkedHashSet<>();
            for (String item : request.getExpertise()) {
                if (item != null && !item.isBlank()) {
                    deduplicated.add(item.trim());
                }
            }
            profile.setExpertise(new ArrayList<>(deduplicated));
        }

        profile = mentorProfileRepository.save(profile);
        String activeKey = getActiveKeyString(mentorUserId);

        return mapToResponse(user, profile, activeKey);
    }

    private User findMentorUser(Long mentorUserId) {
        return userRepository.findById(mentorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found: " + mentorUserId));
    }

    private MentorProfile getOrCreateProfile(User user) {
        return mentorProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> mentorProfileRepository.save(MentorProfile.builder()
                        .userId(user.getId())
                        .joinedAt(Instant.now())
                        .build()));
    }

    private String getActiveKeyString(Long mentorUserId) {
        return mentorKeyRepository.findByMentorUserIdAndStatus(mentorUserId, MentorKeyStatus.ACTIVE)
                .map(MentorKey::getKeyValue)
                .orElse(null);
    }

    private MentorProfileResponse mapToResponse(User user, MentorProfile profile, String activeKey) {
        return MentorProfileResponse.builder()
                .id(String.valueOf(user.getId()))
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .mentorKey(activeKey)
                .title(profile.getTitle())
                .bio(user.getBio())
                .expertise(profile.getExpertise())
                .location(profile.getLocation())
                .avatarUrl(user.getAvatarUrl())
                .emailVerified(user.isEmailVerified())
                .joinedAt(profile.getJoinedAt())
                .build();
    }
}


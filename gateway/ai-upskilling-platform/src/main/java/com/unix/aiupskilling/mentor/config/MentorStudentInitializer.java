package com.unix.aiupskilling.mentor.config;

import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.mentor.model.entity.MentorKey;
import com.unix.aiupskilling.mentor.model.entity.MentorProfile;
import com.unix.aiupskilling.mentor.model.entity.MentorStudentLink;
import com.unix.aiupskilling.mentor.model.enums.MentorKeyStatus;
import com.unix.aiupskilling.mentor.repository.MentorKeyRepository;
import com.unix.aiupskilling.mentor.repository.MentorProfileRepository;
import com.unix.aiupskilling.mentor.repository.MentorStudentLinkRepository;
import com.unix.aiupskilling.mentor.util.MentorKeyGenerator;
import com.unix.aiupskilling.user.Role;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Initializes default accounts on backend startup:
 * - 1 Mentor account (with profile and active key)
 * - 5 Student accounts
 * - Links all 5 students to the Mentor account
 *
 * All operations are idempotent: if accounts or links already exist, they are preserved without duplicate insertions.
 */
@Component
@Order(10)
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.initial-accounts.enabled", havingValue = "true", matchIfMissing = true)
public class MentorStudentInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MentorStudentInitializer.class);

    private final UserRepository userRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentorKeyRepository mentorKeyRepository;
    private final MentorStudentLinkRepository mentorStudentLinkRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.initial-accounts.mentor.email:mentor@example.com}")
    private String mentorEmail;

    @Value("${app.seed.initial-accounts.mentor.username:mentor}")
    private String mentorUsername;

    @Value("${app.seed.initial-accounts.mentor.full-name:Lead Mentor}")
    private String mentorFullName;

    @Value("${app.seed.initial-accounts.default-password:Password123!}")
    private String defaultPassword;

    public record StudentSeed(String username, String email, String fullName) {}

    public static final List<StudentSeed> DEFAULT_STUDENTS = List.of(
            new StudentSeed("student1", "student1@example.com", "Student One"),
            new StudentSeed("student2", "student2@example.com", "Student Two"),
            new StudentSeed("student3", "student3@example.com", "Student Three"),
            new StudentSeed("student4", "student4@example.com", "Student Four"),
            new StudentSeed("student5", "student5@example.com", "Student Five")
    );

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("Starting initialization of default mentor and student accounts...");

        User mentor = getOrCreateMentor();
        ensureMentorProfile(mentor);
        MentorKey mentorKey = getOrCreateMentorKey(mentor);

        for (StudentSeed seed : DEFAULT_STUDENTS) {
            User student = getOrCreateStudent(seed);
            ensureMentorStudentLink(mentor, student, mentorKey);
        }

        log.info("Completed initialization of 1 mentor and 5 connected student accounts.");
    }

    private User getOrCreateMentor() {
        Optional<User> existing = userRepository.findByEmailIgnoreCase(mentorEmail);
        if (existing.isEmpty()) {
            existing = userRepository.findByUsernameIgnoreCase(mentorUsername);
        }

        if (existing.isPresent()) {
            log.info("Mentor account already present: {} (username: {})", existing.get().getEmail(), existing.get().getUsername());
            return existing.get();
        }

        User mentor = User.builder()
                .email(mentorEmail)
                .username(mentorUsername)
                .fullName(mentorFullName)
                .passwordHash(passwordEncoder.encode(defaultPassword))
                .role(Role.MENTOR)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .emailVerifiedAt(LocalDateTime.now())
                .bio("Lead mentor supporting engineering cohorts through structured skills pathways.")
                .avatarUrl(null)
                .build();

        mentor = userRepository.save(mentor);
        log.info("Created default mentor account: id={}, email={}, username={}", mentor.getId(), mentor.getEmail(), mentor.getUsername());
        return mentor;
    }

    private void ensureMentorProfile(User mentor) {
        if (!mentorProfileRepository.existsById(mentor.getId())) {
            MentorProfile profile = MentorProfile.builder()
                    .userId(mentor.getId())
                    .title("Senior Engineering Mentor")
                    .location("Bengaluru, India")
                    .joinedAt(Instant.now())
                    .expertise(new ArrayList<>(List.of("Java", "Spring Boot", "React", "System Design", "Cloud Architecture")))
                    .build();
            mentorProfileRepository.save(profile);
            log.info("Created default mentor profile for mentor id={}", mentor.getId());
        }
    }

    private MentorKey getOrCreateMentorKey(User mentor) {
        Optional<MentorKey> existingKey = mentorKeyRepository.findByMentorUserIdAndStatus(mentor.getId(), MentorKeyStatus.ACTIVE);
        if (existingKey.isPresent()) {
            return existingKey.get();
        }

        String keyValue = "MENTOR-KEY999";
        if (mentorKeyRepository.existsByKeyValue(keyValue)) {
            keyValue = MentorKeyGenerator.generateKey();
        }

        MentorKey key = MentorKey.builder()
                .mentorUserId(mentor.getId())
                .keyValue(keyValue)
                .status(MentorKeyStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();

        key = mentorKeyRepository.save(key);
        log.info("Created mentor key '{}' for mentor id={}", key.getKeyValue(), mentor.getId());
        return key;
    }

    private User getOrCreateStudent(StudentSeed seed) {
        Optional<User> existing = userRepository.findByEmailIgnoreCase(seed.email());
        if (existing.isEmpty()) {
            existing = userRepository.findByUsernameIgnoreCase(seed.username());
        }

        if (existing.isPresent()) {
            log.info("Student account already present: {} (username: {})", existing.get().getEmail(), existing.get().getUsername());
            return existing.get();
        }

        User student = User.builder()
                .email(seed.email())
                .username(seed.username())
                .fullName(seed.fullName())
                .passwordHash(passwordEncoder.encode(defaultPassword))
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .emailVerifiedAt(LocalDateTime.now())
                .bio("Engineering cohort student learner.")
                .avatarUrl(null)
                .build();

        student = userRepository.save(student);
        log.info("Created default student account: id={}, email={}, username={}", student.getId(), student.getEmail(), student.getUsername());
        return student;
    }

    private void ensureMentorStudentLink(User mentor, User student, MentorKey mentorKey) {
        Optional<MentorStudentLink> activeLink = mentorStudentLinkRepository.findByStudentUserIdAndUnlinkedAtIsNull(student.getId());

        if (activeLink.isPresent()) {
            if (activeLink.get().getMentorUserId().equals(mentor.getId())) {
                log.info("Student '{}' is already actively linked to mentor '{}'.", student.getUsername(), mentor.getUsername());
            } else {
                log.warn("Student '{}' is currently linked to another mentor id={}. Skipping relink.",
                        student.getUsername(), activeLink.get().getMentorUserId());
            }
            return;
        }

        MentorStudentLink link = MentorStudentLink.builder()
                .mentorUserId(mentor.getId())
                .studentUserId(student.getId())
                .keyId(mentorKey != null ? mentorKey.getId() : null)
                .linkedAt(Instant.now())
                .build();

        mentorStudentLinkRepository.save(link);
        log.info("Linked student '{}' (id={}) to mentor '{}' (id={}) with key '{}'.",
                student.getUsername(), student.getId(), mentor.getUsername(), mentor.getId(),
                mentorKey != null ? mentorKey.getKeyValue() : "N/A");
    }
}


package com.unix.aiupskilling.mentor;

import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.mentor.config.MentorStudentInitializer;
import com.unix.aiupskilling.mentor.model.entity.MentorKey;
import com.unix.aiupskilling.mentor.model.entity.MentorProfile;
import com.unix.aiupskilling.mentor.model.entity.MentorStudentLink;
import com.unix.aiupskilling.mentor.model.enums.MentorKeyStatus;
import com.unix.aiupskilling.mentor.repository.MentorKeyRepository;
import com.unix.aiupskilling.mentor.repository.MentorProfileRepository;
import com.unix.aiupskilling.mentor.repository.MentorStudentLinkRepository;
import com.unix.aiupskilling.user.Role;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class MentorStudentInitializerTest {

    @Autowired
    private MentorStudentInitializer initializer;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MentorProfileRepository mentorProfileRepository;

    @Autowired
    private MentorKeyRepository mentorKeyRepository;

    @Autowired
    private MentorStudentLinkRepository mentorStudentLinkRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        cleanup();
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        mentorStudentLinkRepository.deleteAll();
        mentorKeyRepository.deleteAll();
        mentorProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Initializer creates 1 mentor and 5 students, all connected to the mentor")
    void shouldInitializeMentorAndFiveConnectedStudents() {
        // Run initializer on clean database
        initializer.run(null);

        // 1. Verify Mentor account
        Optional<User> mentorOpt = userRepository.findByEmailIgnoreCase("mentor@example.com");
        assertThat(mentorOpt).isPresent();

        User mentor = mentorOpt.get();
        assertThat(mentor.getUsername()).isEqualTo("mentor");
        assertThat(mentor.getFullName()).isEqualTo("Lead Mentor");
        assertThat(mentor.getRole()).isEqualTo(Role.MENTOR);
        assertThat(mentor.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(mentor.isEmailVerified()).isTrue();
        assertThat(passwordEncoder.matches("Password123!", mentor.getPasswordHash())).isTrue();

        // 2. Verify Mentor Profile
        Optional<MentorProfile> profileOpt = mentorProfileRepository.findById(mentor.getId());
        assertThat(profileOpt).isPresent();
        assertThat(profileOpt.get().getTitle()).contains("Mentor");
        assertThat(profileOpt.get().getExpertise()).isNotEmpty();

        // 3. Verify Mentor Key
        Optional<MentorKey> keyOpt = mentorKeyRepository.findByMentorUserIdAndStatus(mentor.getId(), MentorKeyStatus.ACTIVE);
        assertThat(keyOpt).isPresent();
        assertThat(keyOpt.get().getKeyValue()).startsWith("MENTOR-");

        // 4. Verify 5 Student accounts
        for (int i = 1; i <= 5; i++) {
            String studentUsername = "student" + i;
            String studentEmail = "student" + i + "@example.com";

            Optional<User> studentOpt = userRepository.findByEmailIgnoreCase(studentEmail);
            assertThat(studentOpt).as("Student %d exists", i).isPresent();

            User student = studentOpt.get();
            assertThat(student.getUsername()).isEqualTo(studentUsername);
            assertThat(student.getRole()).isEqualTo(Role.USER);
            assertThat(student.getStatus()).isEqualTo(AccountStatus.ACTIVE);
            assertThat(student.isEmailVerified()).isTrue();
            assertThat(passwordEncoder.matches("Password123!", student.getPasswordHash())).isTrue();

            // 5. Verify Student is connected to the Mentor
            boolean isLinked = mentorStudentLinkRepository
                    .existsByMentorUserIdAndStudentUserIdAndUnlinkedAtIsNull(mentor.getId(), student.getId());
            assertThat(isLinked).as("Student %d is actively linked to mentor", i).isTrue();
        }

        // Total active links for the mentor should be 5
        List<MentorStudentLink> links = mentorStudentLinkRepository.findAllByMentorUserIdAndUnlinkedAtIsNull(mentor.getId());
        assertThat(links).hasSize(5);
    }

    @Test
    @DisplayName("Initializer is idempotent: running multiple times does not create duplicates")
    void shouldBeIdempotentOnSubsequentRuns() {
        // Run first time
        initializer.run(null);

        long initialUserCount = userRepository.count();
        long initialLinkCount = mentorStudentLinkRepository.count();
        long initialProfileCount = mentorProfileRepository.count();
        long initialKeyCount = mentorKeyRepository.count();

        assertThat(initialUserCount).isEqualTo(6); // 1 mentor + 5 students
        assertThat(initialLinkCount).isEqualTo(5);
        assertThat(initialProfileCount).isEqualTo(1);
        assertThat(initialKeyCount).isEqualTo(1);

        // Run second time
        initializer.run(null);

        assertThat(userRepository.count()).isEqualTo(initialUserCount);
        assertThat(mentorStudentLinkRepository.count()).isEqualTo(initialLinkCount);
        assertThat(mentorProfileRepository.count()).isEqualTo(initialProfileCount);
        assertThat(mentorKeyRepository.count()).isEqualTo(initialKeyCount);
    }
}


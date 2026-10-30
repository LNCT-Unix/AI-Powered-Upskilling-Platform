package com.unix.aiupskilling.mentor.config;

import com.unix.aiupskilling.assessment.config.AssessmentDataLoader;
import com.unix.aiupskilling.assessment.controller.AssessmentController;
import com.unix.aiupskilling.assessment.model.entity.Assessment;
import com.unix.aiupskilling.assessment.repository.AssessmentRepository;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.mentor.model.entity.MentorKey;
import com.unix.aiupskilling.mentor.model.entity.MentorProfile;
import com.unix.aiupskilling.mentor.model.entity.MentorStudentLink;
import com.unix.aiupskilling.mentor.model.entity.SkillAchievement;
import com.unix.aiupskilling.mentor.model.enums.MentorKeyStatus;
import com.unix.aiupskilling.mentor.repository.MentorKeyRepository;
import com.unix.aiupskilling.mentor.repository.MentorProfileRepository;
import com.unix.aiupskilling.mentor.repository.MentorStudentLinkRepository;
import com.unix.aiupskilling.mentor.repository.SkillAchievementRepository;
import com.unix.aiupskilling.user.Role;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.mentor-demo", havingValue = "true", matchIfMissing = true)
public class MentorDataLoader implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MentorDataLoader.class);

    private final UserRepository userRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentorKeyRepository mentorKeyRepository;
    private final MentorStudentLinkRepository mentorStudentLinkRepository;
    private final SkillAchievementRepository skillAchievementRepository;
    private final AssessmentRepository assessmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByUsernameIgnoreCase("meera.mentor")
                || userRepository.existsByEmail("meera.kapoor@example.com")
                || userRepository.existsByEmail("meera.kapoor@mentor.octobyte.demo")) {
            log.info("Demo mentor already exists, skipping mentor demo seed.");
            return;
        }

        log.info("Seeding demo mentor data (Dr. Meera Kapoor, key MENTOR-7X9K2P, 24 students, 18 achievements, 86 assessments)...");

        // 1. Create Mentor User
        User mentor = User.builder()
                .email("meera.kapoor@example.com")
                .username("meera.mentor")
                .fullName("Dr. Meera Kapoor")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(Role.MENTOR)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .bio("I help early-career engineers turn foundational skills into production-ready confidence through focused practice and honest feedback.")
                .avatarUrl(null)
                .build();
        mentor = userRepository.save(mentor);

        // 2. Mentor Profile
        MentorProfile profile = MentorProfile.builder()
                .userId(mentor.getId())
                .title("Senior Software Engineer & Mentor")
                .location("Bengaluru, India")
                .joinedAt(Instant.parse("2026-01-01T00:00:00Z"))
                .expertise(new ArrayList<>(List.of("React", "Python", "System Design", "Career Mentoring")))
                .build();
        mentorProfileRepository.save(profile);

        // 3. Mentor Key
        MentorKey key = MentorKey.builder()
                .mentorUserId(mentor.getId())
                .keyValue("MENTOR-7X9K2P")
                .status(MentorKeyStatus.ACTIVE)
                .createdAt(Instant.parse("2026-09-01T10:00:00Z"))
                .build();
        mentorKeyRepository.save(key);

        // 4. Students
        record StudentSeed(int num, String name, String username, String email, int testsTaken, int avgScore, String joinedAtStr) {}
        List<StudentSeed> studentSeeds = List.of(
                new StudentSeed(1, "Aarav Sharma", "aarav.sharma", "aarav.sharma@student.octobyte.demo", 12, 88, "2026-01-18T00:00:00Z"),
                new StudentSeed(2, "Priya Verma", "priya.verma", "priya.verma@student.octobyte.demo", 10, 82, "2026-02-02T00:00:00Z"),
                new StudentSeed(3, "Rohan Patel", "rohan.patel", "rohan.patel@student.octobyte.demo", 9, 76, "2026-02-21T00:00:00Z"),
                new StudentSeed(4, "Ananya Singh", "ananya.singh", "ananya.singh@student.octobyte.demo", 8, 71, "2026-03-05T00:00:00Z"),
                new StudentSeed(5, "Rahul Gupta", "rahul.gupta", "rahul.gupta@student.octobyte.demo", 7, 58, "2026-03-19T00:00:00Z"),
                new StudentSeed(6, "Sneha Iyer", "sneha.iyer", "sneha.iyer@student.octobyte.demo", 5, 80, "2026-04-02T00:00:00Z"),
                new StudentSeed(7, "Vikram Rao", "vikram.rao", "vikram.rao@student.octobyte.demo", 4, 69, "2026-04-16T00:00:00Z"),
                new StudentSeed(8, "Neha Joshi", "neha.joshi", "neha.joshi@student.octobyte.demo", 4, 85, "2026-04-28T00:00:00Z"),
                new StudentSeed(9, "Karan Mehta", "karan.mehta", "karan.mehta@student.octobyte.demo", 3, 52, "2026-05-09T00:00:00Z"),
                new StudentSeed(10, "Isha Nair", "isha.nair", "isha.nair@student.octobyte.demo", 3, 74, "2026-05-21T00:00:00Z"),
                new StudentSeed(11, "Aditya Kulkarni", "aditya.kulkarni", "aditya.kulkarni@student.octobyte.demo", 3, 77, "2026-06-03T00:00:00Z"),
                new StudentSeed(12, "Meera Desai", "meera.desai", "meera.desai@student.octobyte.demo", 2, 83, "2026-06-17T00:00:00Z"),
                new StudentSeed(13, "Siddharth Menon", "siddharth.menon", "siddharth.menon@student.octobyte.demo", 2, 66, "2026-07-01T00:00:00Z"),
                new StudentSeed(14, "Tanvi Bhat", "tanvi.bhat", "tanvi.bhat@student.octobyte.demo", 2, 48, "2026-07-14T00:00:00Z"),
                new StudentSeed(15, "Arjun Malhotra", "arjun.malhotra", "arjun.malhotra@student.octobyte.demo", 2, 87, "2026-07-26T00:00:00Z"),
                new StudentSeed(16, "Kavya Reddy", "kavya.reddy", "kavya.reddy@student.octobyte.demo", 2, 72, "2026-08-08T00:00:00Z"),
                new StudentSeed(17, "Harsh Vardhan", "harsh.vardhan", "harsh.vardhan@student.octobyte.demo", 1, 45, "2026-08-20T00:00:00Z"),
                new StudentSeed(18, "Riya Sen", "riya.sen", "riya.sen@student.octobyte.demo", 1, 61, "2026-09-01T00:00:00Z"),
                new StudentSeed(19, "Devansh Jain", "devansh.jain", "devansh.jain@student.octobyte.demo", 1, 75, "2026-09-12T00:00:00Z"),
                new StudentSeed(20, "Pooja Mishra", "pooja.mishra", "pooja.mishra@student.octobyte.demo", 1, 54, "2026-09-23T00:00:00Z"),
                new StudentSeed(21, "Nikhil Bansal", "nikhil.bansal", "nikhil.bansal@student.octobyte.demo", 1, 91, "2026-10-01T00:00:00Z"),
                new StudentSeed(22, "Simran Kaur", "simran.kaur", "simran.kaur@student.octobyte.demo", 1, 68, "2026-10-06T00:00:00Z"),
                new StudentSeed(23, "Yash Thakur", "yash.thakur", "yash.thakur@student.octobyte.demo", 1, 49, "2026-10-11T00:00:00Z"),
                new StudentSeed(24, "Aisha Khan", "aisha.khan", "aisha.khan@student.octobyte.demo", 1, 70, "2026-10-17T00:00:00Z")
        );

        Map<Integer, User> studentMap = new HashMap<>();

        for (StudentSeed seed : studentSeeds) {
            User student = User.builder()
                    .email(seed.email())
                    .username(seed.username())
                    .fullName(seed.name())
                    .passwordHash(passwordEncoder.encode("Password123!"))
                    .role(Role.USER)
                    .status(AccountStatus.ACTIVE)
                    .emailVerified(true)
                    .build();
            student = userRepository.save(student);
            studentMap.put(seed.num(), student);

            mentorStudentLinkRepository.save(MentorStudentLink.builder()
                    .mentorUserId(mentor.getId())
                    .studentUserId(student.getId())
                    .keyId(key.getId())
                    .linkedAt(Instant.parse(seed.joinedAtStr()))
                    .build());
        }

        // 5. Achievements
        record AchievementSeed(int studentNum, String skill, String skillKey, String category, String proficiency, int progress, String dateStr) {}
        List<AchievementSeed> achSeeds = List.of(
                new AchievementSeed(1, "Python Programming", "python", "Programming", "EXPERT", 96, "2026-10-24T00:00:00Z"),
                new AchievementSeed(2, "Machine Learning Basics", "ml", "AI & ML", "ADVANCED", 88, "2026-10-22T00:00:00Z"),
                new AchievementSeed(3, "React Development", "react", "Frontend", "ADVANCED", 86, "2026-10-21T00:00:00Z"),
                new AchievementSeed(8, "Python Programming", "python", "Programming", "ADVANCED", 90, "2026-10-19T00:00:00Z"),
                new AchievementSeed(4, "SQL Fundamentals", "sql", "Databases", "INTERMEDIATE", 78, "2026-10-18T00:00:00Z"),
                new AchievementSeed(1, "Data Structures & Algorithms", "dsa", "Data Structures", "ADVANCED", 89, "2026-10-16T00:00:00Z"),
                new AchievementSeed(12, "Machine Learning Basics", "ml", "AI & ML", "INTERMEDIATE", 76, "2026-10-14T00:00:00Z"),
                new AchievementSeed(2, "SQL Fundamentals", "sql", "Databases", "ADVANCED", 85, "2026-10-12T00:00:00Z"),
                new AchievementSeed(3, "Python Programming", "python", "Programming", "INTERMEDIATE", 74, "2026-10-10T00:00:00Z"),
                new AchievementSeed(6, "React Development", "react", "Frontend", "INTERMEDIATE", 72, "2026-10-08T00:00:00Z"),
                new AchievementSeed(1, "Problem Solving", "problem-solving", "Problem Solving", "ADVANCED", 91, "2026-10-05T00:00:00Z"),
                new AchievementSeed(3, "Problem Solving", "problem-solving", "Problem Solving", "INTERMEDIATE", 70, "2026-10-02T00:00:00Z"),
                new AchievementSeed(4, "Data Structures & Algorithms", "dsa", "Data Structures", "INTERMEDIATE", 68, "2026-09-29T00:00:00Z"),
                new AchievementSeed(5, "Python Programming", "python", "Programming", "BEGINNER", 54, "2026-09-25T00:00:00Z"),
                new AchievementSeed(7, "SQL Fundamentals", "sql", "Databases", "BEGINNER", 49, "2026-09-20T00:00:00Z"),
                new AchievementSeed(13, "Problem Solving", "problem-solving", "Problem Solving", "BEGINNER", 58, "2026-09-18T00:00:00Z"),
                new AchievementSeed(16, "React Development", "react", "Frontend", "BEGINNER", 62, "2026-09-15T00:00:00Z"),
                new AchievementSeed(5, "Problem Solving", "problem-solving", "Problem Solving", "BEGINNER", 51, "2026-09-10T00:00:00Z")
        );

        for (AchievementSeed ach : achSeeds) {
            User student = studentMap.get(ach.studentNum());
            if (student == null) continue;

            skillAchievementRepository.save(SkillAchievement.builder()
                    .studentUserId(student.getId())
                    .skillName(ach.skill())
                    .skillSlug(ach.skillKey())
                    .category(ach.category())
                    .proficiency(ach.proficiency())
                    .progress(ach.progress())
                    .verifiedAt(Instant.parse(ach.dateStr()))
                    .build());
        }

        // 6. Assessments (86 total: 80 completed, 6 in-progress)
        // Set completion timestamps distributed over recent days
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Set<Integer> inProgressStudentNums = Set.of(1, 5, 6, 9, 14, 17); // 6 in progress

        int completedAssigned = 0;
        int[] weeklyBuckets = {8, 12, 9, 15, 11, 18, 7}; // 80 completed across the 7 days

        for (StudentSeed seed : studentSeeds) {
            User student = studentMap.get(seed.num());
            UUID studentUuid = AssessmentController.userIdFromLong(student.getId());

            boolean hasInProgress = inProgressStudentNums.contains(seed.num());
            int completedCount = hasInProgress ? (seed.testsTaken() - 1) : seed.testsTaken();

            for (int t = 0; t < completedCount; t++) {
                Assessment asm = new Assessment();
                asm.setUserId(studentUuid);
                asm.setTrackId(AssessmentDataLoader.BACKEND_TRACK_ID);
                asm.setStatus("COMPLETED");
                asm.setItemsAdministered(10);
                asm.setCorrectCount((int) Math.round(seed.avgScore() / 10.0));

                // Determine day index for weekly activity
                int dayOffset = Math.min(6, completedAssigned % 7);
                Instant completedTime = today.minusDays(6 - dayOffset).atStartOfDay(ZoneOffset.UTC).toInstant().plus(t * 30L + 60L, ChronoUnit.MINUTES);
                asm.setCompletedAt(completedTime);

                assessmentRepository.save(asm);
                completedAssigned++;
            }

            if (hasInProgress) {
                Assessment inProg = new Assessment();
                inProg.setUserId(studentUuid);
                inProg.setTrackId(AssessmentDataLoader.BACKEND_TRACK_ID);
                inProg.setStatus("IN_PROGRESS");
                inProg.setItemsAdministered(5);
                inProg.setCorrectCount(3);
                inProg.setCompletedAt(null);
                assessmentRepository.save(inProg);
            }
        }

        log.info("Demo mentor data successfully seeded.");
    }
}

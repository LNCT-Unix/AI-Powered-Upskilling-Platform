package com.unix.aiupskilling.mentor.service.impl;

import com.unix.aiupskilling.assessment.controller.AssessmentController;
import com.unix.aiupskilling.assessment.model.entity.Assessment;
import com.unix.aiupskilling.assessment.repository.AssessmentRepository;
import com.unix.aiupskilling.mentor.dto.MentorDashboardOverviewResponse;
import com.unix.aiupskilling.mentor.dto.MentorDashboardOverviewResponse.*;
import com.unix.aiupskilling.mentor.model.entity.MentorKey;
import com.unix.aiupskilling.mentor.model.entity.MentorStudentLink;
import com.unix.aiupskilling.mentor.model.entity.SkillAchievement;
import com.unix.aiupskilling.mentor.model.enums.MentorKeyStatus;
import com.unix.aiupskilling.mentor.model.enums.ProgressBand;
import com.unix.aiupskilling.mentor.repository.MentorKeyRepository;
import com.unix.aiupskilling.mentor.repository.MentorStudentLinkRepository;
import com.unix.aiupskilling.mentor.repository.SkillAchievementRepository;
import com.unix.aiupskilling.mentor.service.MentorDashboardService;
import com.unix.aiupskilling.shared.exception.ResourceNotFoundException;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MentorDashboardServiceImpl implements MentorDashboardService {

    private final UserRepository userRepository;
    private final MentorStudentLinkRepository mentorStudentLinkRepository;
    private final MentorKeyRepository mentorKeyRepository;
    private final SkillAchievementRepository skillAchievementRepository;
    private final AssessmentRepository assessmentRepository;

    @Override
    @Transactional(readOnly = true)
    public MentorDashboardOverviewResponse getOverview(Long mentorUserId) {
        User mentor = userRepository.findById(mentorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found: " + mentorUserId));

        String activeKey = mentorKeyRepository.findByMentorUserIdAndStatus(mentorUserId, MentorKeyStatus.ACTIVE)
                .map(MentorKey::getKeyValue)
                .orElse(null);

        MentorSummary mentorSummary = MentorSummary.builder()
                .id(String.valueOf(mentor.getId()))
                .fullName(mentor.getFullName())
                .avatarUrl(mentor.getAvatarUrl())
                .build();

        List<MentorStudentLink> activeLinks = mentorStudentLinkRepository.findAllByMentorUserIdAndUnlinkedAtIsNull(mentorUserId);
        List<Long> studentUserIds = activeLinks.stream().map(MentorStudentLink::getStudentUserId).toList();

        if (studentUserIds.isEmpty()) {
            return MentorDashboardOverviewResponse.builder()
                    .mentor(mentorSummary)
                    .stats(CohortStats.builder()
                            .totalStudents(0)
                            .testsTaken(0)
                            .skillsAchieved(0)
                            .activeStudents(0)
                            .averageProgress(0)
                            .averageScore(0)
                            .build())
                    .progressBuckets(List.of(
                            ProgressBucket.builder().band(ProgressBand.ADVANCED.name()).label(ProgressBand.ADVANCED.getLabel()).count(0).build(),
                            ProgressBucket.builder().band(ProgressBand.ON_TRACK.name()).label(ProgressBand.ON_TRACK.getLabel()).count(0).build(),
                            ProgressBucket.builder().band(ProgressBand.NEEDS_ATTENTION.name()).label(ProgressBand.NEEDS_ATTENTION.getLabel()).count(0).build()
                    ))
                    .topStudents(List.of())
                    .recentAchievements(List.of())
                    .mentorKey(activeKey)
                    .build();
        }

        Map<Long, User> studentMap = userRepository.findAllById(studentUserIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<SkillAchievement> achievements = skillAchievementRepository.findAllByStudentUserIdIn(studentUserIds);
        Map<Long, List<SkillAchievement>> achievementsByStudent = achievements.stream()
                .collect(Collectors.groupingBy(SkillAchievement::getStudentUserId));

        List<UUID> studentUuids = studentUserIds.stream().map(AssessmentController::userIdFromLong).toList();
        List<Assessment> assessments = assessmentRepository.findAllByUserIdIn(studentUuids);
        Map<UUID, List<Assessment>> assessmentsByStudent = assessments.stream()
                .collect(Collectors.groupingBy(Assessment::getUserId));

        // Compute metrics per student
        Instant now = Instant.now();
        Instant thirtyDaysAgo = now.minus(Duration.ofDays(30));

        long activeStudentsCount = 0;
        int totalProgressSum = 0;
        long totalCompletedTests = 0;
        double weightedScoreSum = 0.0;

        long advancedCount = 0;
        long onTrackCount = 0;
        long needsAttentionCount = 0;

        List<TopStudentDto> topStudentCandidates = new ArrayList<>();

        for (Long studentId : studentUserIds) {
            User student = studentMap.get(studentId);
            if (student == null) continue;

            UUID studentUuid = AssessmentController.userIdFromLong(studentId);
            List<Assessment> studentTests = assessmentsByStudent.getOrDefault(studentUuid, List.of());
            List<SkillAchievement> studentAchs = achievementsByStudent.getOrDefault(studentId, List.of());

            // Determine last activity timestamp
            Instant lastActiveAt = determineLastActive(student, studentTests, studentAchs);
            if (lastActiveAt != null && lastActiveAt.isAfter(thirtyDaysAgo)) {
                activeStudentsCount++;
            }

            // Student progress calculation
            int progress = calculateStudentProgress(studentAchs, studentTests);
            totalProgressSum += progress;

            ProgressBand band = ProgressBand.fromProgress(progress);
            if (band == ProgressBand.ADVANCED) advancedCount++;
            else if (band == ProgressBand.ON_TRACK) onTrackCount++;
            else needsAttentionCount++;

            // Accumulate completed assessment scores
            for (Assessment test : studentTests) {
                if ("COMPLETED".equalsIgnoreCase(test.getStatus())) {
                    int score = computeAssessmentScore(test);
                    weightedScoreSum += score;
                    totalCompletedTests++;
                }
            }

            topStudentCandidates.add(TopStudentDto.builder()
                    .id(String.valueOf(student.getId()))
                    .name(student.getFullName())
                    .username(student.getUsername())
                    .avatarUrl(student.getAvatarUrl())
                    .progress(progress)
                    .progressLabel(band.getLabel())
                    .build());
        }

        int avgProgress = studentUserIds.isEmpty() ? 0 : Math.round((float) totalProgressSum / studentUserIds.size());
        int avgScore = (totalCompletedTests > 0) ? (int) Math.round(weightedScoreSum / totalCompletedTests) : 0;

        // Top 5 students: sorted by progress desc, then name asc
        topStudentCandidates.sort(Comparator
                .comparingInt(TopStudentDto::getProgress).reversed()
                .thenComparing(s -> s.getName() != null ? s.getName().toLowerCase() : ""));

        List<TopStudentDto> top5Students = topStudentCandidates.stream().limit(5).toList();

        // Recent 4 achievements sorted by verifiedAt desc
        List<RecentAchievementDto> recentAchievements = achievements.stream()
                .sorted(Comparator.comparing(SkillAchievement::getVerifiedAt).reversed())
                .limit(4)
                .map(a -> {
                    User stu = studentMap.get(a.getStudentUserId());
                    String stuName = (stu != null && stu.getFullName() != null) ? stu.getFullName() : "Student";
                    return RecentAchievementDto.builder()
                            .id(String.valueOf(a.getId()))
                            .studentId(String.valueOf(a.getStudentUserId()))
                            .studentName(stuName)
                            .skill(a.getSkillName())
                            .skillKey(a.getSkillSlug())
                            .category(a.getCategory())
                            .proficiency(a.getProficiency())
                            .date(a.getVerifiedAt())
                            .build();
                })
                .toList();

        return MentorDashboardOverviewResponse.builder()
                .mentor(mentorSummary)
                .stats(CohortStats.builder()
                        .totalStudents(studentUserIds.size())
                        .testsTaken(assessments.size())
                        .skillsAchieved(achievements.size())
                        .activeStudents(activeStudentsCount)
                        .averageProgress(avgProgress)
                        .averageScore(avgScore)
                        .build())
                .progressBuckets(List.of(
                        ProgressBucket.builder().band(ProgressBand.ADVANCED.name()).label(ProgressBand.ADVANCED.getLabel()).count(advancedCount).build(),
                        ProgressBucket.builder().band(ProgressBand.ON_TRACK.name()).label(ProgressBand.ON_TRACK.getLabel()).count(onTrackCount).build(),
                        ProgressBucket.builder().band(ProgressBand.NEEDS_ATTENTION.name()).label(ProgressBand.NEEDS_ATTENTION.getLabel()).count(needsAttentionCount).build()
                ))
                .topStudents(top5Students)
                .recentAchievements(recentAchievements)
                .mentorKey(activeKey)
                .build();
    }

    private Instant determineLastActive(User student, List<Assessment> tests, List<SkillAchievement> achs) {
        Instant latest = null;

        for (Assessment a : tests) {
            if (a.getCompletedAt() != null && (latest == null || a.getCompletedAt().isAfter(latest))) {
                latest = a.getCompletedAt();
            }
        }

        for (SkillAchievement sa : achs) {
            if (sa.getVerifiedAt() != null && (latest == null || sa.getVerifiedAt().isAfter(latest))) {
                latest = sa.getVerifiedAt();
            }
        }

        if (latest == null && student.getUpdatedAt() != null) {
            latest = student.getUpdatedAt().toInstant(ZoneOffset.UTC);
        }

        if (latest == null && student.getCreatedAt() != null) {
            latest = student.getCreatedAt().toInstant(ZoneOffset.UTC);
        }

        return latest != null ? latest : Instant.now();
    }

    private int calculateStudentProgress(List<SkillAchievement> achs, List<Assessment> tests) {
        if (!achs.isEmpty()) {
            double sum = achs.stream().mapToInt(SkillAchievement::getProgress).sum();
            return (int) Math.round(sum / achs.size());
        }
        if (!tests.isEmpty()) {
            List<Assessment> completed = tests.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus())).toList();
            if (!completed.isEmpty()) {
                double sum = completed.stream().mapToInt(this::computeAssessmentScore).sum();
                return (int) Math.round(sum / completed.size());
            }
        }
        return 0;
    }

    private int computeAssessmentScore(Assessment a) {
        if (a.getItemsAdministered() != null && a.getItemsAdministered() > 0 && a.getCorrectCount() != null) {
            return (int) Math.round((double) a.getCorrectCount() / (double) a.getItemsAdministered() * 100.0);
        }
        return 0;
    }
}


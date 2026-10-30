package com.unix.aiupskilling.mentor.service.impl;

import com.unix.aiupskilling.assessment.controller.AssessmentController;
import com.unix.aiupskilling.assessment.model.entity.Assessment;
import com.unix.aiupskilling.assessment.repository.AssessmentRepository;
import com.unix.aiupskilling.mentor.dto.MentorAnalyticsTestResponse;
import com.unix.aiupskilling.mentor.dto.MentorAnalyticsTestResponse.*;
import com.unix.aiupskilling.mentor.dto.MentorRecentActivityItemDto;
import com.unix.aiupskilling.mentor.exception.InvalidDateRangeException;
import com.unix.aiupskilling.mentor.model.entity.MentorStudentLink;
import com.unix.aiupskilling.mentor.model.entity.SkillAchievement;
import com.unix.aiupskilling.mentor.model.enums.ProgressBand;
import com.unix.aiupskilling.mentor.repository.MentorStudentLinkRepository;
import com.unix.aiupskilling.mentor.repository.SkillAchievementRepository;
import com.unix.aiupskilling.mentor.service.MentorAnalyticsService;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MentorAnalyticsServiceImpl implements MentorAnalyticsService {

    private final MentorStudentLinkRepository mentorStudentLinkRepository;
    private final UserRepository userRepository;
    private final SkillAchievementRepository skillAchievementRepository;
    private final AssessmentRepository assessmentRepository;

    @Override
    @Transactional(readOnly = true)
    public MentorAnalyticsTestResponse getTestAnalytics(Long mentorUserId, LocalDate from, LocalDate to, String track) {
        LocalDate effectiveTo = (to != null) ? to : LocalDate.now(ZoneOffset.UTC);
        LocalDate effectiveFrom = (from != null) ? from : effectiveTo.minusDays(6);

        if (effectiveFrom.isAfter(effectiveTo)) {
            throw new InvalidDateRangeException("from date cannot be after to date");
        }

        List<MentorStudentLink> activeLinks = mentorStudentLinkRepository.findAllByMentorUserIdAndUnlinkedAtIsNull(mentorUserId);
        if (activeLinks.isEmpty()) {
            return buildEmptyAnalyticsResponse(effectiveTo);
        }

        List<Long> studentUserIds = activeLinks.stream().map(MentorStudentLink::getStudentUserId).toList();
        Map<Long, User> studentMap = userRepository.findAllById(studentUserIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<SkillAchievement> allAchievements = skillAchievementRepository.findAllByStudentUserIdIn(studentUserIds);
        Map<Long, List<SkillAchievement>> achByStudent = allAchievements.stream()
                .collect(Collectors.groupingBy(SkillAchievement::getStudentUserId));

        List<UUID> studentUuids = studentUserIds.stream().map(AssessmentController::userIdFromLong).toList();
        List<Assessment> allAssessments = assessmentRepository.findAllByUserIdIn(studentUuids);
        Map<UUID, List<Assessment>> testByStudent = allAssessments.stream()
                .collect(Collectors.groupingBy(Assessment::getUserId));

        // Totals
        int testsTaken = allAssessments.size();
        List<Assessment> completedAssessments = allAssessments.stream()
                .filter(a -> "COMPLETED".equalsIgnoreCase(a.getStatus()))
                .toList();
        int completedTests = completedAssessments.size();
        int inProgressTests = testsTaken - completedTests;
        int completionRate = testsTaken > 0 ? (int) Math.round((double) completedTests / testsTaken * 100.0) : 0;

        int totalScoreSum = 0;
        for (Assessment ca : completedAssessments) {
            totalScoreSum += computeAssessmentScore(ca);
        }
        int averageScore = completedTests > 0 ? (int) Math.round((double) totalScoreSum / completedTests) : 0;
        int averageDurationSeconds = 1080;

        AnalyticsTotals totals = AnalyticsTotals.builder()
                .testsTaken(testsTaken)
                .completedTests(completedTests)
                .inProgressTests(inProgressTests)
                .averageScore(averageScore)
                .completionRate(completionRate)
                .averageDurationSeconds(averageDurationSeconds)
                .build();

        // Exactly 7 weekly activity buckets ending on effectiveTo
        List<WeeklyActivityItem> weeklyActivity = new ArrayList<>();
        Map<LocalDate, Integer> testsCountByDate = new HashMap<>();
        for (Assessment a : allAssessments) {
            if (a.getCompletedAt() != null) {
                LocalDate testDate = a.getCompletedAt().atZone(ZoneOffset.UTC).toLocalDate();
                testsCountByDate.merge(testDate, 1, Integer::sum);
            }
        }

        for (int i = 6; i >= 0; i--) {
            LocalDate bucketDate = effectiveTo.minusDays(i);
            String dateStr = bucketDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
            String dayStr = bucketDate.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            int count = testsCountByDate.getOrDefault(bucketDate, 0);
            weeklyActivity.add(WeeklyActivityItem.builder()
                    .date(dateStr)
                    .day(dayStr)
                    .value(count)
                    .build());
        }

        // Student analytics list & progress bands
        int advancedCount = 0;
        int onTrackCount = 0;
        int needsAttentionCount = 0;
        List<StudentAnalyticsDto> students = new ArrayList<>();

        for (Long studentId : studentUserIds) {
            User student = studentMap.get(studentId);
            if (student == null) continue;

            UUID studentUuid = AssessmentController.userIdFromLong(studentId);
            List<Assessment> studentTests = testByStudent.getOrDefault(studentUuid, List.of());
            List<SkillAchievement> studentAchs = achByStudent.getOrDefault(studentId, List.of());

            int progress = calculateStudentProgress(studentAchs, studentTests);
            ProgressBand band = ProgressBand.fromProgress(progress);
            if (band == ProgressBand.ADVANCED) advancedCount++;
            else if (band == ProgressBand.ON_TRACK) onTrackCount++;
            else needsAttentionCount++;

            int studentAvgScore = calculateAverageScore(studentTests);

            students.add(StudentAnalyticsDto.builder()
                    .id(String.valueOf(student.getId()))
                    .name(student.getFullName())
                    .username(student.getUsername())
                    .avatarUrl(student.getAvatarUrl())
                    .testsTaken(studentTests.size())
                    .averageScore(studentAvgScore)
                    .progress(progress)
                    .progressLabel(band.getLabel())
                    .progressBand(band.name())
                    .build());
        }

        // Order students by averageScore DESC, testsTaken DESC
        students.sort(Comparator.comparingInt(StudentAnalyticsDto::getAverageScore).reversed()
                .thenComparing(Comparator.comparingInt(StudentAnalyticsDto::getTestsTaken).reversed()));

        boolean truncated = false;
        if (students.size() > 500) {
            students = students.subList(0, 500);
            truncated = true;
        }

        List<ProgressBandItem> progressBands = List.of(
                ProgressBandItem.builder().band(ProgressBand.ADVANCED.name()).label(ProgressBand.ADVANCED.getLabel()).count(advancedCount).build(),
                ProgressBandItem.builder().band(ProgressBand.ON_TRACK.name()).label(ProgressBand.ON_TRACK.getLabel()).count(onTrackCount).build(),
                ProgressBandItem.builder().band(ProgressBand.NEEDS_ATTENTION.name()).label(ProgressBand.NEEDS_ATTENTION.getLabel()).count(needsAttentionCount).build()
        );

        return MentorAnalyticsTestResponse.builder()
                .totals(totals)
                .weeklyActivity(weeklyActivity)
                .progressBands(progressBands)
                .students(students)
                .truncated(truncated)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MentorRecentActivityItemDto> getRecentActivity(Long mentorUserId, int limit, String studentId, String status) {
        int clampedLimit = (limit <= 0) ? 8 : Math.min(limit, 50);

        List<MentorStudentLink> activeLinks = mentorStudentLinkRepository.findAllByMentorUserIdAndUnlinkedAtIsNull(mentorUserId);
        if (activeLinks.isEmpty()) {
            return List.of();
        }

        List<Long> cohortStudentIds = activeLinks.stream().map(MentorStudentLink::getStudentUserId).toList();

        // If studentId filter is provided, enforce cohort ownership
        List<Long> targetStudentIds = cohortStudentIds;
        if (studentId != null && !studentId.isBlank()) {
            try {
                Long requestedId = Long.parseLong(studentId.startsWith("stu-") ? studentId.substring(4) : studentId);
                if (!cohortStudentIds.contains(requestedId)) {
                    return List.of();
                }
                targetStudentIds = List.of(requestedId);
            } catch (NumberFormatException e) {
                return List.of();
            }
        }

        Map<Long, User> studentMap = userRepository.findAllById(targetStudentIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<UUID> targetUuids = targetStudentIds.stream().map(AssessmentController::userIdFromLong).toList();
        List<Assessment> assessments = assessmentRepository.findAllByUserIdsOrderByCompletedAtDesc(targetUuids);

        // Optional status filter
        if (status != null && !status.isBlank()) {
            assessments = assessments.stream()
                    .filter(a -> status.equalsIgnoreCase(a.getStatus()))
                    .toList();
        }

        // Map reverse UUID to Long studentId
        Map<UUID, Long> uuidToStudentId = new HashMap<>();
        for (Long sid : targetStudentIds) {
            uuidToStudentId.put(AssessmentController.userIdFromLong(sid), sid);
        }

        List<MentorRecentActivityItemDto> results = new ArrayList<>();
        Instant now = Instant.now();

        for (Assessment a : assessments) {
            if (results.size() >= clampedLimit) break;

            Long sid = uuidToStudentId.get(a.getUserId());
            User student = (sid != null) ? studentMap.get(sid) : null;
            String studentName = (student != null) ? student.getFullName() : "Unknown Student";
            String studentIdStr = (student != null) ? String.valueOf(student.getId()) : (sid != null ? String.valueOf(sid) : "");

            boolean isCompleted = "COMPLETED".equalsIgnoreCase(a.getStatus());
            Integer score = isCompleted ? computeAssessmentScore(a) : null;
            Instant occurredAt = a.getCompletedAt() != null ? a.getCompletedAt() : now;

            results.add(MentorRecentActivityItemDto.builder()
                    .id("act-" + a.getId())
                    .studentId(studentIdStr)
                    .studentName(studentName)
                    .assessmentId(String.valueOf(a.getId()))
                    .testName("Adaptive Diagnostic")
                    .score(score)
                    .status(a.getStatus() != null ? a.getStatus() : "IN_PROGRESS")
                    .occurredAt(occurredAt)
                    .build());
        }

        return results;
    }

    private MentorAnalyticsTestResponse buildEmptyAnalyticsResponse(LocalDate toDate) {
        List<WeeklyActivityItem> weeklyActivity = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = toDate.minusDays(i);
            weeklyActivity.add(WeeklyActivityItem.builder()
                    .date(d.format(DateTimeFormatter.ISO_LOCAL_DATE))
                    .day(d.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                    .value(0)
                    .build());
        }

        return MentorAnalyticsTestResponse.builder()
                .totals(AnalyticsTotals.builder()
                        .testsTaken(0)
                        .completedTests(0)
                        .inProgressTests(0)
                        .averageScore(0)
                        .completionRate(0)
                        .averageDurationSeconds(0)
                        .build())
                .weeklyActivity(weeklyActivity)
                .progressBands(List.of(
                        ProgressBandItem.builder().band(ProgressBand.ADVANCED.name()).label(ProgressBand.ADVANCED.getLabel()).count(0).build(),
                        ProgressBandItem.builder().band(ProgressBand.ON_TRACK.name()).label(ProgressBand.ON_TRACK.getLabel()).count(0).build(),
                        ProgressBandItem.builder().band(ProgressBand.NEEDS_ATTENTION.name()).label(ProgressBand.NEEDS_ATTENTION.getLabel()).count(0).build()
                ))
                .students(List.of())
                .truncated(false)
                .build();
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

    private int calculateAverageScore(List<Assessment> tests) {
        List<Assessment> completed = tests.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus())).toList();
        if (completed.isEmpty()) return 0;
        double sum = completed.stream().mapToInt(this::computeAssessmentScore).sum();
        return (int) Math.round(sum / completed.size());
    }

    private int computeAssessmentScore(Assessment a) {
        if (a.getItemsAdministered() != null && a.getItemsAdministered() > 0 && a.getCorrectCount() != null) {
            return (int) Math.round((double) a.getCorrectCount() / (double) a.getItemsAdministered() * 100.0);
        }
        return 0;
    }
}


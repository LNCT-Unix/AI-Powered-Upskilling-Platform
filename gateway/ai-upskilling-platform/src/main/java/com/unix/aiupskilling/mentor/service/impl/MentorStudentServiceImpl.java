package com.unix.aiupskilling.mentor.service.impl;

import com.unix.aiupskilling.assessment.controller.AssessmentController;
import com.unix.aiupskilling.assessment.model.entity.Assessment;
import com.unix.aiupskilling.assessment.repository.AssessmentRepository;
import com.unix.aiupskilling.mentor.dto.StudentDetailResponse;
import com.unix.aiupskilling.mentor.dto.StudentDetailResponse.StudentAchievementDto;
import com.unix.aiupskilling.mentor.dto.StudentDetailResponse.StudentTestHistoryDto;
import com.unix.aiupskilling.mentor.dto.StudentRowDto;
import com.unix.aiupskilling.mentor.exception.InvalidProgressBandException;
import com.unix.aiupskilling.mentor.exception.InvalidSortException;
import com.unix.aiupskilling.mentor.exception.StudentNotFoundException;
import com.unix.aiupskilling.mentor.model.entity.MentorStudentLink;
import com.unix.aiupskilling.mentor.model.entity.SkillAchievement;
import com.unix.aiupskilling.mentor.model.enums.ProgressBand;
import com.unix.aiupskilling.mentor.repository.MentorStudentLinkRepository;
import com.unix.aiupskilling.mentor.repository.SkillAchievementRepository;
import com.unix.aiupskilling.mentor.service.MentorStudentService;
import com.unix.aiupskilling.shared.dto.PagedResponse;
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
public class MentorStudentServiceImpl implements MentorStudentService {

    private final MentorStudentLinkRepository mentorStudentLinkRepository;
    private final UserRepository userRepository;
    private final SkillAchievementRepository skillAchievementRepository;
    private final AssessmentRepository assessmentRepository;

    private static final List<String> ALLOWED_PROGRESS_BANDS = List.of("ADVANCED", "ON_TRACK", "NEEDS_ATTENTION");
    private static final List<String> ALLOWED_SORTS = List.of("name", "tests_desc", "progress_desc", "progress_asc", "recent");

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<StudentRowDto> getStudents(
            Long mentorUserId,
            String query,
            String progressBand,
            String sort,
            int page,
            int size) {

        if (progressBand != null && !progressBand.isBlank() && !ALLOWED_PROGRESS_BANDS.contains(progressBand.toUpperCase())) {
            throw new InvalidProgressBandException("Unknown progress band.", ALLOWED_PROGRESS_BANDS);
        }

        String resolvedSort = (sort != null && !sort.isBlank()) ? sort.toLowerCase() : "name";
        if (!ALLOWED_SORTS.contains(resolvedSort)) {
            throw new InvalidSortException("Unknown sort option.", ALLOWED_SORTS);
        }

        int clampedPage = Math.max(page, 0);
        int clampedSize = (size <= 0) ? 20 : Math.min(size, 100);

        List<MentorStudentLink> activeLinks = mentorStudentLinkRepository.findAllByMentorUserIdAndUnlinkedAtIsNull(mentorUserId);
        if (activeLinks.isEmpty()) {
            return PagedResponse.of(List.of(), clampedPage, clampedSize, 0);
        }

        Map<Long, Instant> linkedAtMap = activeLinks.stream()
                .collect(Collectors.toMap(MentorStudentLink::getStudentUserId, MentorStudentLink::getLinkedAt, (a, b) -> a));

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

        Instant now = Instant.now();
        List<StudentRowDto> rows = new ArrayList<>();

        for (Long studentId : studentUserIds) {
            User student = studentMap.get(studentId);
            if (student == null) continue;

            UUID studentUuid = AssessmentController.userIdFromLong(studentId);
            List<Assessment> studentTests = testByStudent.getOrDefault(studentUuid, List.of());
            List<SkillAchievement> studentAchs = achByStudent.getOrDefault(studentId, List.of());

            int progress = calculateStudentProgress(studentAchs, studentTests);
            ProgressBand band = ProgressBand.fromProgress(progress);

            Instant lastActiveAt = determineLastActive(student, studentTests, studentAchs);
            double lastActiveDays = calculateDaysAgo(lastActiveAt, now);
            boolean active = lastActiveDays <= 30.0;

            int avgScore = calculateAverageScore(studentTests);
            Instant joinedAt = linkedAtMap.getOrDefault(studentId, now);

            rows.add(StudentRowDto.builder()
                    .id(String.valueOf(student.getId()))
                    .name(student.getFullName())
                    .username(student.getUsername())
                    .email(student.getEmail())
                    .avatarUrl(student.getAvatarUrl())
                    .skillsAchieved(studentAchs.size())
                    .testsTaken(studentTests.size())
                    .progress(progress)
                    .progressLabel(band.getLabel())
                    .progressBand(band.name())
                    .active(active)
                    .lastActiveAt(lastActiveAt)
                    .lastActiveDays(roundTwoDecimals(lastActiveDays))
                    .averageScore(avgScore)
                    .track("Backend Engineering")
                    .joinedAt(joinedAt)
                    .build());
        }

        // Filter by search query (q matches name OR username case-insensitively)
        if (query != null && !query.isBlank()) {
            String lowerQ = query.trim().toLowerCase();
            rows = rows.stream()
                    .filter(r -> (r.getName() != null && r.getName().toLowerCase().contains(lowerQ))
                            || (r.getUsername() != null && r.getUsername().toLowerCase().contains(lowerQ)))
                    .collect(Collectors.toList());
        }

        // Filter by progressBand
        if (progressBand != null && !progressBand.isBlank()) {
            String targetBand = progressBand.trim().toUpperCase();
            rows = rows.stream()
                    .filter(r -> targetBand.equals(r.getProgressBand()))
                    .collect(Collectors.toList());
        }

        // Sort
        Comparator<StudentRowDto> comparator = switch (resolvedSort) {
            case "tests_desc" -> Comparator.comparingLong(StudentRowDto::getTestsTaken).reversed()
                    .thenComparing(r -> r.getName() != null ? r.getName().toLowerCase() : "");
            case "progress_desc" -> Comparator.comparingInt(StudentRowDto::getProgress).reversed()
                    .thenComparing(r -> r.getName() != null ? r.getName().toLowerCase() : "");
            case "progress_asc" -> Comparator.comparingInt(StudentRowDto::getProgress)
                    .thenComparing(r -> r.getName() != null ? r.getName().toLowerCase() : "");
            case "recent" -> Comparator.comparing(StudentRowDto::getLastActiveAt, Comparator.nullsLast(Comparator.reverseOrder()))
                    .thenComparing(r -> r.getName() != null ? r.getName().toLowerCase() : "");
            default -> Comparator.comparing((StudentRowDto r) -> r.getName() != null ? r.getName().toLowerCase() : "")
                    .thenComparing(StudentRowDto::getId);
        };

        rows.sort(comparator);

        int totalElements = rows.size();
        int fromIndex = clampedPage * clampedSize;
        List<StudentRowDto> pagedContent;

        if (fromIndex >= totalElements) {
            pagedContent = List.of();
        } else {
            int toIndex = Math.min(fromIndex + clampedSize, totalElements);
            pagedContent = rows.subList(fromIndex, toIndex);
        }

        return PagedResponse.of(pagedContent, clampedPage, clampedSize, totalElements);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentDetailResponse getStudentDetail(Long mentorUserId, Long studentUserId) {
        if (!mentorStudentLinkRepository.existsByMentorUserIdAndStudentUserIdAndUnlinkedAtIsNull(mentorUserId, studentUserId)) {
            throw new StudentNotFoundException("Student not found.");
        }

        User student = userRepository.findById(studentUserId)
                .orElseThrow(() -> new StudentNotFoundException("Student not found."));

        UUID studentUuid = AssessmentController.userIdFromLong(studentUserId);
        List<Assessment> studentTests = assessmentRepository.findHistoryByUserId(studentUuid);
        List<SkillAchievement> studentAchs = skillAchievementRepository.findAllByStudentUserId(studentUserId);

        Instant now = Instant.now();
        int progress = calculateStudentProgress(studentAchs, studentTests);
        ProgressBand band = ProgressBand.fromProgress(progress);
        Instant lastActiveAt = determineLastActive(student, studentTests, studentAchs);
        double lastActiveDays = calculateDaysAgo(lastActiveAt, now);
        int avgScore = calculateAverageScore(studentTests);

        Optional<MentorStudentLink> linkOpt = mentorStudentLinkRepository
                .findByMentorUserIdAndStudentUserIdAndUnlinkedAtIsNull(mentorUserId, studentUserId);
        Instant joinedAt = linkOpt.map(MentorStudentLink::getLinkedAt).orElse(now);

        StudentRowDto studentRow = StudentRowDto.builder()
                .id(String.valueOf(student.getId()))
                .name(student.getFullName())
                .username(student.getUsername())
                .email(student.getEmail())
                .avatarUrl(student.getAvatarUrl())
                .skillsAchieved(studentAchs.size())
                .testsTaken(studentTests.size())
                .progress(progress)
                .progressLabel(band.getLabel())
                .progressBand(band.name())
                .active(lastActiveDays <= 30.0)
                .lastActiveAt(lastActiveAt)
                .lastActiveDays(roundTwoDecimals(lastActiveDays))
                .averageScore(avgScore)
                .track("Backend Engineering")
                .joinedAt(joinedAt)
                .build();

        List<StudentAchievementDto> achievements = studentAchs.stream()
                .sorted(Comparator.comparing(SkillAchievement::getVerifiedAt).reversed())
                .map(a -> StudentAchievementDto.builder()
                        .id(String.valueOf(a.getId()))
                        .skill(a.getSkillName())
                        .skillKey(a.getSkillSlug())
                        .category(a.getCategory())
                        .proficiency(a.getProficiency())
                        .progress(a.getProgress())
                        .date(a.getVerifiedAt())
                        .build())
                .toList();

        List<StudentTestHistoryDto> testHistory = studentTests.stream()
                .limit(10)
                .map(t -> {
                    Integer score = "COMPLETED".equalsIgnoreCase(t.getStatus()) ? computeAssessmentScore(t) : null;
                    Instant testDate = t.getCompletedAt() != null ? t.getCompletedAt() : now;
                    return StudentTestHistoryDto.builder()
                            .assessmentId(String.valueOf(t.getId()))
                            .name("Adaptive Diagnostic")
                            .score(score)
                            .status(t.getStatus() != null ? t.getStatus() : "IN_PROGRESS")
                            .date(testDate)
                            .build();
                })
                .toList();

        return StudentDetailResponse.builder()
                .student(studentRow)
                .achievements(achievements)
                .testHistory(testHistory)
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

    private double calculateDaysAgo(Instant then, Instant now) {
        if (then == null) return 0.0;
        long millis = Math.max(0, Duration.between(then, now).toMillis());
        return (double) millis / (1000.0 * 60.0 * 60.0 * 24.0);
    }

    private double roundTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
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

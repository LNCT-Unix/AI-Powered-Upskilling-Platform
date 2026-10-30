package com.unix.aiupskilling.mentor.service.impl;

import com.unix.aiupskilling.mentor.dto.AchievementFacetsResponse;
import com.unix.aiupskilling.mentor.dto.AchievementFacetsResponse.FacetSummary;
import com.unix.aiupskilling.mentor.dto.AchievementRowDto;
import com.unix.aiupskilling.mentor.model.entity.MentorStudentLink;
import com.unix.aiupskilling.mentor.model.entity.SkillAchievement;
import com.unix.aiupskilling.mentor.repository.MentorStudentLinkRepository;
import com.unix.aiupskilling.mentor.repository.SkillAchievementRepository;
import com.unix.aiupskilling.mentor.service.MentorAchievementService;
import com.unix.aiupskilling.shared.dto.PagedResponse;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MentorAchievementServiceImpl implements MentorAchievementService {

    private final MentorStudentLinkRepository mentorStudentLinkRepository;
    private final SkillAchievementRepository skillAchievementRepository;
    private final UserRepository userRepository;

    public static final List<String> CONTROLLED_CATEGORIES = List.of(
            "Programming",
            "Data Structures",
            "Frontend",
            "Databases",
            "AI & ML",
            "Problem Solving"
    );

    public static final List<String> CONTROLLED_PROFICIENCIES = List.of(
            "BEGINNER",
            "INTERMEDIATE",
            "ADVANCED",
            "EXPERT"
    );

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AchievementRowDto> getAchievements(
            Long mentorUserId,
            String query,
            String category,
            String proficiency,
            String studentId,
            String sort,
            int page,
            int size) {

        int clampedPage = Math.max(page, 0);
        int clampedSize = (size <= 0) ? 20 : Math.min(size, 100);

        List<MentorStudentLink> activeLinks = mentorStudentLinkRepository.findAllByMentorUserIdAndUnlinkedAtIsNull(mentorUserId);
        if (activeLinks.isEmpty()) {
            return PagedResponse.of(List.of(), clampedPage, clampedSize, 0);
        }

        List<Long> studentUserIds = activeLinks.stream().map(MentorStudentLink::getStudentUserId).toList();

        // If scoped to a specific studentId, ensure that student is linked to this mentor
        if (studentId != null && !studentId.isBlank()) {
            try {
                long sid = Long.parseLong(studentId.trim());
                if (!studentUserIds.contains(sid)) {
                    return PagedResponse.of(List.of(), clampedPage, clampedSize, 0);
                }
                studentUserIds = List.of(sid);
            } catch (NumberFormatException e) {
                return PagedResponse.of(List.of(), clampedPage, clampedSize, 0);
            }
        }

        Map<Long, User> studentMap = userRepository.findAllById(studentUserIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<SkillAchievement> achievements = skillAchievementRepository.findAllByStudentUserIdIn(studentUserIds);

        List<AchievementRowDto> rows = new ArrayList<>();
        for (SkillAchievement a : achievements) {
            User student = studentMap.get(a.getStudentUserId());
            String studentName = (student != null && student.getFullName() != null) ? student.getFullName() : "Student";
            String studentUsername = (student != null && student.getUsername() != null) ? student.getUsername() : "";

            rows.add(AchievementRowDto.builder()
                    .id(String.valueOf(a.getId()))
                    .studentId(String.valueOf(a.getStudentUserId()))
                    .studentName(studentName)
                    .studentUsername(studentUsername)
                    .skill(a.getSkillName())
                    .skillKey(a.getSkillSlug())
                    .category(a.getCategory())
                    .proficiency(a.getProficiency())
                    .progress(a.getProgress())
                    .date(a.getVerifiedAt())
                    .build());
        }

        // Filter: q (matches skill OR studentName case-insensitively)
        if (query != null && !query.isBlank()) {
            String lowerQ = query.trim().toLowerCase();
            rows = rows.stream()
                    .filter(r -> (r.getSkill() != null && r.getSkill().toLowerCase().contains(lowerQ))
                            || (r.getStudentName() != null && r.getStudentName().toLowerCase().contains(lowerQ)))
                    .collect(Collectors.toList());
        }

        // Filter: category
        if (category != null && !category.isBlank()) {
            String lowerCat = category.trim().toLowerCase();
            rows = rows.stream()
                    .filter(r -> r.getCategory() != null && r.getCategory().toLowerCase().equals(lowerCat))
                    .collect(Collectors.toList());
        }

        // Filter: proficiency
        if (proficiency != null && !proficiency.isBlank()) {
            String upperProf = proficiency.trim().toUpperCase();
            rows = rows.stream()
                    .filter(r -> r.getProficiency() != null && r.getProficiency().equalsIgnoreCase(upperProf))
                    .collect(Collectors.toList());
        }

        // Sort: date_desc (default) or date_asc
        boolean isAsc = "date_asc".equalsIgnoreCase(sort);
        Comparator<AchievementRowDto> comparator = Comparator.comparing(AchievementRowDto::getDate);
        if (!isAsc) {
            comparator = comparator.reversed();
        }
        rows.sort(comparator);

        int totalElements = rows.size();
        int fromIndex = clampedPage * clampedSize;
        List<AchievementRowDto> pagedContent;

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
    public AchievementFacetsResponse getFacets(Long mentorUserId) {
        List<MentorStudentLink> activeLinks = mentorStudentLinkRepository.findAllByMentorUserIdAndUnlinkedAtIsNull(mentorUserId);
        if (activeLinks.isEmpty()) {
            return AchievementFacetsResponse.builder()
                    .categories(CONTROLLED_CATEGORIES)
                    .proficiencies(CONTROLLED_PROFICIENCIES)
                    .summary(FacetSummary.builder()
                            .totalAchievements(0)
                            .uniqueSkills(0)
                            .studentsWithAchievements(0)
                            .topLevelCount(0)
                            .build())
                    .build();
        }

        List<Long> studentUserIds = activeLinks.stream().map(MentorStudentLink::getStudentUserId).toList();
        List<SkillAchievement> achievements = skillAchievementRepository.findAllByStudentUserIdIn(studentUserIds);

        long totalAchievements = achievements.size();
        long uniqueSkills = achievements.stream().map(SkillAchievement::getSkillSlug).distinct().count();
        long studentsWithAchievements = achievements.stream().map(SkillAchievement::getStudentUserId).distinct().count();
        long topLevelCount = achievements.stream()
                .filter(a -> "ADVANCED".equalsIgnoreCase(a.getProficiency()) || "EXPERT".equalsIgnoreCase(a.getProficiency()))
                .count();

        return AchievementFacetsResponse.builder()
                .categories(CONTROLLED_CATEGORIES)
                .proficiencies(CONTROLLED_PROFICIENCIES)
                .summary(FacetSummary.builder()
                        .totalAchievements(totalAchievements)
                        .uniqueSkills(uniqueSkills)
                        .studentsWithAchievements(studentsWithAchievements)
                        .topLevelCount(topLevelCount)
                        .build())
                .build();
    }
}

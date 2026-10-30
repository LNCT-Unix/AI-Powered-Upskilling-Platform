package com.unix.aiupskilling.mentor.service;

import com.unix.aiupskilling.mentor.dto.AchievementFacetsResponse;
import com.unix.aiupskilling.mentor.dto.AchievementRowDto;
import com.unix.aiupskilling.shared.dto.PagedResponse;

public interface MentorAchievementService {

    PagedResponse<AchievementRowDto> getAchievements(
            Long mentorUserId,
            String query,
            String category,
            String proficiency,
            String studentId,
            String sort,
            int page,
            int size
    );

    AchievementFacetsResponse getFacets(Long mentorUserId);
}

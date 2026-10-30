package com.unix.aiupskilling.mentor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementFacetsResponse {

    private List<String> categories;
    private List<String> proficiencies;
    private FacetSummary summary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FacetSummary {
        private long totalAchievements;
        private long uniqueSkills;
        private long studentsWithAchievements;
        private long topLevelCount;
    }
}

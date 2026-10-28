package com.unix.aiupskilling.assessment.repository;

import com.unix.aiupskilling.assessment.model.entity.Skill;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SkillRepository extends JpaRepository<Skill, UUID> {

    /** All skills of a track with their prerequisite ids loaded, easiest first. */
    @Query("""
            SELECT DISTINCT s FROM Skill s LEFT JOIN FETCH s.prerequisites
            WHERE s.trackId = :trackId ORDER BY s.difficulty""")
    List<Skill> findByTrackIdWithPrerequisites(@Param("trackId") UUID trackId);

    /** All skills of a track without prerequisite join, for listing. */
    List<Skill> findByTrackIdOrderByDifficultyAsc(UUID trackId);

    /** Find a skill by track and slug (e.g. for known-skills onboarding lookup). */
    Optional<Skill> findByTrackIdAndSlug(UUID trackId, String slug);

    /** Find all skills matching a set of slugs within a track. */
    @Query("SELECT s FROM Skill s WHERE s.trackId = :trackId AND s.slug IN :slugs")
    List<Skill> findByTrackIdAndSlugIn(@Param("trackId") UUID trackId, @Param("slugs") List<String> slugs);
}

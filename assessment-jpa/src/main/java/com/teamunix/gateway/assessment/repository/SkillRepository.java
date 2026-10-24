package com.teamunix.gateway.assessment.repository;

import com.teamunix.gateway.assessment.entity.Skill;
import java.util.List;
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
}

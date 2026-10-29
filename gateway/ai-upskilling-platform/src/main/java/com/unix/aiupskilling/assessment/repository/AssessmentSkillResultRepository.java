package com.unix.aiupskilling.assessment.repository;

import com.unix.aiupskilling.assessment.model.entity.AssessmentSkillResult;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssessmentSkillResultRepository extends JpaRepository<AssessmentSkillResult, UUID> {

    /** Saved skill states of a finished test, grouped by cluster, easiest skill first. */
    @EntityGraph(attributePaths = "skill")
    @Query("SELECT r FROM AssessmentSkillResult r WHERE r.assessment.id = :assessmentId ORDER BY r.skill.cluster ASC, r.skill.difficulty ASC")
    List<AssessmentSkillResult> findByAssessmentIdOrderBySkillClusterAscSkillDifficultyAsc(@Param("assessmentId") UUID assessmentId);

    /** Finds the saved skill state for a specific assessment and skill. */
    Optional<AssessmentSkillResult> findByAssessmentIdAndSkillId(UUID assessmentId, UUID skillId);
}

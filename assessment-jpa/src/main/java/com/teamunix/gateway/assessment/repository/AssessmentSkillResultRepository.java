package com.teamunix.gateway.assessment.repository;

import com.teamunix.gateway.assessment.entity.AssessmentSkillResult;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssessmentSkillResultRepository extends JpaRepository<AssessmentSkillResult, UUID> {

    /** Saved skill states of a finished test, grouped by cluster, easiest skill first. */
    @EntityGraph(attributePaths = "skill")
    List<AssessmentSkillResult> findByAssessmentIdOrderBySkillClusterAscSkillDifficultyAsc(UUID assessmentId);
}

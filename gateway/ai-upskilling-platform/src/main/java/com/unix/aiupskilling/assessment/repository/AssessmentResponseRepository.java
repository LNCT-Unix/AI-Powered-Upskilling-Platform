package com.unix.aiupskilling.assessment.repository;

import com.unix.aiupskilling.assessment.model.entity.AssessmentResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssessmentResponseRepository extends JpaRepository<AssessmentResponse, UUID> {

    /** All responses for an assessment ordered by question sequence. */
    List<AssessmentResponse> findByAssessmentIdOrderBySeq(UUID assessmentId);

    /**
     * All responses with the related AssessmentItem eagerly loaded.
     * Used by the report endpoint to build per-question breakdowns without N+1 queries.
     */
    @EntityGraph(attributePaths = "item")
    @Query("SELECT r FROM AssessmentResponse r WHERE r.assessment.id = :assessmentId ORDER BY r.seq")
    List<AssessmentResponse> findByAssessmentIdWithItemOrderBySeq(@Param("assessmentId") UUID assessmentId);
}

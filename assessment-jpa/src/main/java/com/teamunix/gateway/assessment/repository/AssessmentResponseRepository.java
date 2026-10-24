package com.teamunix.gateway.assessment.repository;

import com.teamunix.gateway.assessment.entity.AssessmentResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssessmentResponseRepository extends JpaRepository<AssessmentResponse, UUID> {

    /** The answers so far, oldest first, with each answer's item loaded in the same query. */
    @Query("SELECT r FROM AssessmentResponse r JOIN FETCH r.item WHERE r.assessmentId = :assessmentId ORDER BY r.seq")
    List<AssessmentResponse> findByAssessmentIdOrderBySeq(@Param("assessmentId") UUID assessmentId);
}

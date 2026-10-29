package com.unix.aiupskilling.assessment.repository;

import com.unix.aiupskilling.assessment.model.entity.AssessmentItem;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssessmentItemRepository extends JpaRepository<AssessmentItem, UUID> {

    /**
     * Loads all ACTIVE items for a track ordered by difficulty.
     */
    List<AssessmentItem> findByTrackIdAndStatusOrderByDifficultyAsc(UUID trackId, String status);

    /**
     * The unused ACTIVE question of a track whose difficulty is closest to the current theta.
     * Uses a LEFT JOIN anti-join instead of NOT IN (correlated subquery) for an efficient
     * query plan on larger item pools. Call with Limit.of(1) to get just the next question.
     */
    @Query("""
            SELECT i FROM AssessmentItem i
            LEFT JOIN AssessmentResponse r
                ON r.item.id = i.id AND r.assessment.id = :assessmentId
            WHERE i.trackId = :trackId
              AND i.status = 'ACTIVE'
              AND r.id IS NULL
            ORDER BY ABS(i.difficulty - :theta), i.id""")
    List<AssessmentItem> findNext(@Param("trackId") UUID trackId,
                                  @Param("assessmentId") UUID assessmentId,
                                  @Param("theta") double theta,
                                  Limit limit);
}

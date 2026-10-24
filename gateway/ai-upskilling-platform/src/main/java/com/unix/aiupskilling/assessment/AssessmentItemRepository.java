package com.unix.aiupskilling.assessment;

import com.unix.aiupskilling.assessment.AssessmentItem;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssessmentItemRepository extends JpaRepository<AssessmentItem, UUID> {

    /**
     * The unused ACTIVE questions of a track, closest difficulty to the estimate first
     * (ties by id, so replays are identical). Call with Limit.of(1) to get just the next one.
     */
    @Query("""
            SELECT i FROM AssessmentItem i
            WHERE i.trackId = :trackId AND i.status = 'ACTIVE'
              AND i.id NOT IN (SELECT r.item.id FROM AssessmentResponse r
                               WHERE r.assessment.id = :assessmentId)
            ORDER BY ABS(i.difficulty - :theta), i.id""")
    List<AssessmentItem> findNext(@Param("trackId") UUID trackId,
                                  @Param("assessmentId") UUID assessmentId,
                                  @Param("theta") double theta,
                                  Limit limit);
}

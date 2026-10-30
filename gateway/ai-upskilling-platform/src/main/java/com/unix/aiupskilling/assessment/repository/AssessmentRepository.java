package com.unix.aiupskilling.assessment.repository;

import com.unix.aiupskilling.assessment.model.entity.Assessment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {

    /** The assessment only if it belongs to this user. */
    Optional<Assessment> findByIdAndUserId(UUID id, UUID userId);

    /** Used by start(): an unfinished test for this user and track, if any. */
    Optional<Assessment> findFirstByUserIdAndTrackIdAndStatus(UUID userId, UUID trackId, String status);

    /** Most recent finished assessment for user and track. */
    Optional<Assessment> findFirstByUserIdAndTrackIdOrderByCompletedAtDesc(UUID userId, UUID trackId);

    /** Most recent finished assessment for user. */
    Optional<Assessment> findFirstByUserIdOrderByCompletedAtDesc(UUID userId);

    /** All assessments taken by this user, ordered with latest completed first. */
    @Query("SELECT a FROM Assessment a WHERE a.userId = :userId ORDER BY a.completedAt DESC NULLS LAST, a.id DESC")
    List<Assessment> findHistoryByUserId(@Param("userId") UUID userId);

    List<Assessment> findAllByUserIdIn(java.util.Collection<UUID> userIds);

    @Query("SELECT a FROM Assessment a WHERE a.userId IN :userIds ORDER BY a.completedAt DESC NULLS LAST, a.id DESC")
    List<Assessment> findAllByUserIdsOrderByCompletedAtDesc(@Param("userIds") java.util.Collection<UUID> userIds);
}

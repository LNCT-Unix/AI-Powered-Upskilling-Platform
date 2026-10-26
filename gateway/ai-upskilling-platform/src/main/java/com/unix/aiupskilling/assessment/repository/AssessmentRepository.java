package com.unix.aiupskilling.assessment.repository;

import com.unix.aiupskilling.assessment.model.entity.Assessment;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {

    /** The assessment only if it belongs to this user. */
    Optional<Assessment> findByIdAndUserId(UUID id, UUID userId);

    /** Used by start(): an unfinished test for this user and track, if any. */
    Optional<Assessment> findFirstByUserIdAndTrackIdAndStatus(UUID userId, UUID trackId, String status);

    /** Same as findByIdAndUserId, but takes a row lock so two simultaneous answers cannot both pass. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Assessment a WHERE a.id = :id AND a.userId = :userId")
    Optional<Assessment> findByIdAndUserIdForUpdate(@Param("id") UUID id, @Param("userId") UUID userId);
}

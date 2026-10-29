package com.unix.aiupskilling.assessment.repository;

import com.unix.aiupskilling.assessment.model.entity.Assessment;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {

    /** The assessment only if it belongs to this user. */
    Optional<Assessment> findByIdAndUserId(UUID id, UUID userId);

    /** Used by start(): an unfinished test for this user and track, if any. */
    Optional<Assessment> findFirstByUserIdAndTrackIdAndStatus(UUID userId, UUID trackId, String status);
}

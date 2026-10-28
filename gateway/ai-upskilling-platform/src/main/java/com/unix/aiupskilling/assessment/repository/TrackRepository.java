package com.unix.aiupskilling.assessment.repository;

import com.unix.aiupskilling.assessment.model.entity.Track;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Queries on the Track table. */
public interface TrackRepository extends JpaRepository<Track, UUID> {

    /** All ACTIVE tracks, for the onboarding track picker. */
    List<Track> findByStatusOrderByNameAsc(String status);
}

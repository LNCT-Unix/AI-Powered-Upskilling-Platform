package com.unix.aiupskilling.assessment.repository;

import com.unix.aiupskilling.assessment.model.entity.Track;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** findById comes from JpaRepository, that is all the service needs. */
public interface TrackRepository extends JpaRepository<Track, UUID> {
}

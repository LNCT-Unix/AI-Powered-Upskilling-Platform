package com.unix.aiupskilling.mentor.repository;

import com.unix.aiupskilling.mentor.model.entity.MentorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MentorProfileRepository extends JpaRepository<MentorProfile, Long> {

    Optional<MentorProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}

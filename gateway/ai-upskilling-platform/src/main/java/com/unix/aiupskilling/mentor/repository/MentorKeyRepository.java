package com.unix.aiupskilling.mentor.repository;

import com.unix.aiupskilling.mentor.model.entity.MentorKey;
import com.unix.aiupskilling.mentor.model.enums.MentorKeyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MentorKeyRepository extends JpaRepository<MentorKey, UUID> {

    Optional<MentorKey> findByMentorUserIdAndStatus(Long mentorUserId, MentorKeyStatus status);

    Optional<MentorKey> findByKeyValueAndStatus(String keyValue, MentorKeyStatus status);

    Optional<MentorKey> findByKeyValue(String keyValue);

    boolean existsByKeyValue(String keyValue);

    List<MentorKey> findAllByMentorUserId(Long mentorUserId);

    long countByMentorUserId(Long mentorUserId);
}

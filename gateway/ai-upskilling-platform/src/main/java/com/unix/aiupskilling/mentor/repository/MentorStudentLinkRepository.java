package com.unix.aiupskilling.mentor.repository;

import com.unix.aiupskilling.mentor.model.entity.MentorStudentLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MentorStudentLinkRepository extends JpaRepository<MentorStudentLink, Long> {

    Optional<MentorStudentLink> findByStudentUserIdAndUnlinkedAtIsNull(Long studentUserId);

    Optional<MentorStudentLink> findByMentorUserIdAndStudentUserIdAndUnlinkedAtIsNull(Long mentorUserId, Long studentUserId);

    List<MentorStudentLink> findAllByMentorUserIdAndUnlinkedAtIsNull(Long mentorUserId);

    long countByMentorUserIdAndUnlinkedAtIsNull(Long mentorUserId);

    boolean existsByMentorUserIdAndStudentUserIdAndUnlinkedAtIsNull(Long mentorUserId, Long studentUserId);

    long countByKeyIdAndUnlinkedAtIsNull(UUID keyId);
}

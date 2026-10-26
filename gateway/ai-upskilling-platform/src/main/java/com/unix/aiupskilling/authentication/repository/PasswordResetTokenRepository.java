package com.unix.aiupskilling.authentication.repository;

import com.unix.aiupskilling.authentication.model.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<PasswordResetToken> findByResetTokenHash(String resetTokenHash);

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.consumedAt = :now WHERE t.userId = :userId AND t.consumedAt IS NULL")
    void invalidateAllForUser(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime since);
}

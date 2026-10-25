package com.unix.ai_upskilling_platform.authentication.repository;

import com.unix.ai_upskilling_platform.authentication.model.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    Optional<EmailVerificationToken> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime since);

    List<EmailVerificationToken> findByUserIdAndConsumedAtIsNull(Long userId);

    @Modifying
    @Query("UPDATE EmailVerificationToken t SET t.consumedAt = :now WHERE t.userId = :userId AND t.consumedAt IS NULL")
    void invalidateAllForUser(@Param("userId") Long userId, @Param("now") LocalDateTime now);


    @Modifying
    @Query("UPDATE EmailVerificationToken t SET t.consumedAt = :consumedAt WHERE t.id = :id AND t.consumedAt IS NULL")
    int markConsumedIfUnconsumed(@Param("id") Long id, @Param("consumedAt") LocalDateTime consumedAt);
}

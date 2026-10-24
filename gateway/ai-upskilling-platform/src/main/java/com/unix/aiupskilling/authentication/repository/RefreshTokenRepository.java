package com.unix.aiupskilling.authentication.repository;

import com.unix.aiupskilling.authentication.model.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findByFamilyId(String familyId);

    List<RefreshToken> findByUserId(Long userId);
}

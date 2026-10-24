package com.unix.ai_upskilling_platform.authentication.repository;

import com.unix.ai_upskilling_platform.authentication.model.entity.OAuthLoginCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OAuthLoginCodeRepository extends JpaRepository<OAuthLoginCode, Long> {

    Optional<OAuthLoginCode> findByCodeHash(String codeHash);
}

package com.unix.ai_upskilling_platform.authentication.repository;

import com.unix.ai_upskilling_platform.authentication.model.entity.OAuthLinkIntent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OAuthLinkIntentRepository extends JpaRepository<OAuthLinkIntent, Long> {

    Optional<OAuthLinkIntent> findByIntentHash(String intentHash);
}

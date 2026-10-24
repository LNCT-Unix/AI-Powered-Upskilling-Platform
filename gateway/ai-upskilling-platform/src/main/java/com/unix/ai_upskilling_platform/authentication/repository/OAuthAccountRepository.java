package com.unix.ai_upskilling_platform.authentication.repository;

import com.unix.ai_upskilling_platform.authentication.model.entity.OAuthAccount;
import com.unix.ai_upskilling_platform.authentication.model.enums.OAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, Long> {

    Optional<OAuthAccount> findByProviderAndProviderSubject(OAuthProvider provider, String providerSubject);

    Optional<OAuthAccount> findByUserIdAndProvider(Long userId, OAuthProvider provider);

    List<OAuthAccount> findByUserId(Long userId);

    boolean existsByUserIdAndProvider(Long userId, OAuthProvider provider);

    boolean existsByProviderAndProviderSubject(OAuthProvider provider, String providerSubject);
}

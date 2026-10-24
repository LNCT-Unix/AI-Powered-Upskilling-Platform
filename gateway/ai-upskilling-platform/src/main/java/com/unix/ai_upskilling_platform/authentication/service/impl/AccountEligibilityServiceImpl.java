package com.unix.ai_upskilling_platform.authentication.service.impl;

import com.unix.ai_upskilling_platform.authentication.exception.AccountNotEligibleException;
import com.unix.ai_upskilling_platform.authentication.model.enums.AccountStatus;
import com.unix.ai_upskilling_platform.authentication.service.AccountEligibilityService;
import com.unix.ai_upskilling_platform.model.entity.User;
import org.springframework.stereotype.Service;

@Service
public class AccountEligibilityServiceImpl implements AccountEligibilityService {

    @Override
    public void assertCanLoginWithPassword(User u) {
        if (u == null) {
            throw new AccountNotEligibleException("User cannot be null", "INVALID_CREDENTIALS");
        }
        if (u.getStatus() == AccountStatus.DISABLED) {
            throw new AccountNotEligibleException("Account is disabled", "ACCOUNT_DISABLED");
        }
        if (!u.isEmailVerified()) {
            throw new AccountNotEligibleException("Email is not verified", "EMAIL_NOT_VERIFIED");
        }
    }

    @Override
    public void assertCanAuthenticate(User u) {
        if (u == null) {
            throw new AccountNotEligibleException("User cannot be null", "UNAUTHORIZED");
        }
        if (u.getStatus() == AccountStatus.DISABLED) {
            throw new AccountNotEligibleException("Account is disabled", "ACCOUNT_DISABLED");
        }
    }
}

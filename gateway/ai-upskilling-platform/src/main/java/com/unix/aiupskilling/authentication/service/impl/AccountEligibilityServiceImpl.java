package com.unix.aiupskilling.authentication.service.impl;

import com.unix.aiupskilling.authentication.exception.AccountNotEligibleException;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.service.AccountEligibilityService;
import com.unix.aiupskilling.user.User;
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

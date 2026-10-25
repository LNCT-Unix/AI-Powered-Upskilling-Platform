package com.unix.ai_upskilling_platform.authentication.event;

import com.unix.ai_upskilling_platform.authentication.service.EmailSender;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class EmailVerificationEventListener {

    private final EmailSender emailSender;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onEmailVerificationEvent(EmailVerificationEvent event) {
        emailSender.sendVerificationEmail(event.email(), event.fullName(), event.rawToken());
    }
}

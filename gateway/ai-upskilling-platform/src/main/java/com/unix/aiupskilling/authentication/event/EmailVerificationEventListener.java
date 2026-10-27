package com.unix.aiupskilling.authentication.event;

import com.unix.aiupskilling.authentication.service.EmailSender;
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
        emailSender.sendVerificationEmail(event.email(), event.fullName(), event.otp());
    }
}

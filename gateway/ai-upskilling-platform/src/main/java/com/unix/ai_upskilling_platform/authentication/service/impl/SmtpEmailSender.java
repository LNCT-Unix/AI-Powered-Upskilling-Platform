package com.unix.ai_upskilling_platform.authentication.service.impl;

import com.unix.ai_upskilling_platform.authentication.config.AuthProperties;
import com.unix.ai_upskilling_platform.authentication.service.EmailSender;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class SmtpEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailSender.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final AuthProperties authProperties;

    @Value("${app.mail.from:noreply@ai-upskilling.com}")
    private String fromAddress;

    @Override
    public void sendVerificationEmail(String toEmail, String fullName, String rawToken) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Verification email was not sent via SMTP.");
            return;
        }

        String verificationUrl = authProperties.getFrontend().getVerificationUrl();
        String link = verificationUrl + "#token=" + rawToken;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Verify your email address - AI Upskilling Platform");

            String greeting = (fullName != null && !fullName.isBlank()) ? "Hello " + fullName + "," : "Hello,";
            String body = greeting + "\n\n"
                    + "Thank you for registering with AI Upskilling Platform.\n"
                    + "Please verify your email address by clicking the link below:\n\n"
                    + link + "\n\n"
                    + "This link will expire in 24 hours.\n"
                    + "If you did not request this, you can safely ignore this email.\n\n"
                    + "Best regards,\nAI Upskilling Platform Team";

            helper.setText(body, false);
            mailSender.send(message);

            log.info("Verification email sent successfully.");
        } catch (Exception e) {
            log.error("Failed to send verification email: {}", e.getMessage());
        }
    }
}

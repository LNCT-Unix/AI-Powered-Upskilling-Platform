package com.unix.aiupskilling.authentication.service.impl;

import com.unix.aiupskilling.authentication.config.AuthProperties;
import com.unix.aiupskilling.authentication.service.EmailSender;
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
    public void sendVerificationEmail(String toEmail, String fullName, String otp) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.error("SMTP is not configured — verification email was NOT sent to: {}. " +
                    "Set SPRING_MAIL_USERNAME and SPRING_MAIL_PASSWORD environment variables " +
                    "(and SPRING_MAIL_HOST / SPRING_MAIL_PORT if needed).", toEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Verify your email address - AI Upskilling Platform");

            String greeting = (fullName != null && !fullName.isBlank()) ? "Hello " + fullName + "," : "Hello,";
            String body = greeting + "\n\n"
                    + "Thank you for registering with AI Upskilling Platform.\n"
                    + "Your 6-digit email verification code is:\n\n"
                    + "    " + otp + "\n\n"
                    + "This code will expire in 10 minutes.\n"
                    + "If you did not request this, you can safely ignore this email.\n\n"
                    + "Best regards,\nAI Upskilling Platform Team";

            helper.setText(body, false);
            mailSender.send(message);

            log.info("Verification email sent successfully.");
        } catch (Exception e) {
            log.error("Failed to send verification email: {}", e.getMessage());
        }
    }

    @Override
    public void sendPasswordResetOtpEmail(String toEmail, String fullName, String otp) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.error("SMTP is not configured — password reset OTP email was NOT sent to: {}. " +
                    "Set SPRING_MAIL_USERNAME and SPRING_MAIL_PASSWORD environment variables " +
                    "(and SPRING_MAIL_HOST / SPRING_MAIL_PORT if needed).", toEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Password Reset OTP - AI Upskilling Platform");

            String greeting = (fullName != null && !fullName.isBlank()) ? "Hello " + fullName + "," : "Hello,";
            String body = greeting + "\n\n"
                    + "We received a request to reset your password.\n"
                    + "Your 6-digit one-time verification code is:\n\n"
                    + "    " + otp + "\n\n"
                    + "This code is valid for 10 minutes.\n"
                    + "If you did not request a password reset, please ignore this email and your password will remain unchanged.\n\n"
                    + "Best regards,\nAI Upskilling Platform Team";

            helper.setText(body, false);
            mailSender.send(message);

            log.info("Password reset OTP email sent successfully.");
        } catch (Exception e) {
            log.error("Failed to send password reset OTP email: {}", e.getMessage());
        }
    }
}

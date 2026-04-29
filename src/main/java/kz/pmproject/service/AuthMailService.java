package kz.pmproject.service;

import kz.pmproject.config.AuthProperties;
import kz.pmproject.model.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthMailService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final JavaMailSender javaMailSender;
    private final AuthProperties authProperties;

    public void sendEmailVerification(User user, String token, LocalDateTime expiresAt) {
        String link = buildLink("/verify-email", token);
        String body = """
                Hello %s,

                Welcome to UniShare.
                Confirm your email address by opening this link:
                %s

                This link expires at %s.
                """.formatted(user.getUsername(), link, DATE_TIME_FORMATTER.format(expiresAt));

        send(user.getEmail(), "Confirm your UniShare email", body);
    }

    public void sendPasswordReset(User user, String token, LocalDateTime expiresAt) {
        String link = buildLink("/reset-password", token);
        String body = """
                Hello %s,

                We received a request to reset your UniShare password.
                Create a new password using this link:
                %s

                This link expires at %s.
                If you did not request this, you can ignore this email.
                """.formatted(user.getUsername(), link, DATE_TIME_FORMATTER.format(expiresAt));

        send(user.getEmail(), "Reset your UniShare password", body);
    }

    private String buildLink(String path, String token) {
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        return authProperties.getFrontendBaseUrl() + path + "?token=" + encodedToken;
    }

    private void send(String to, String subject, String body) {
        if ("smtp".equalsIgnoreCase(authProperties.getMailMode())) {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(authProperties.getMailFrom());
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            javaMailSender.send(message);
            return;
        }

        log.info("Auth email [{}] to {}:\n{}", subject, to, body);
    }
}

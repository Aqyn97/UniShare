package kz.pmproject.service;

import kz.pmproject.config.AuthProperties;
import kz.pmproject.model.user.dto.EmailRequest;
import kz.pmproject.model.user.dto.LoginRequest;
import kz.pmproject.model.user.dto.RegisterRequest;
import kz.pmproject.model.user.dto.ResetPasswordRequest;
import kz.pmproject.model.user.entity.EmailActionToken;
import kz.pmproject.model.user.entity.OpaqueToken;
import kz.pmproject.model.user.entity.Role;
import kz.pmproject.model.user.entity.User;
import kz.pmproject.model.user.enums.EmailActionTokenPurpose;
import kz.pmproject.model.user.enums.RoleDic;
import kz.pmproject.repository.OpaqueTokenRepository;
import kz.pmproject.repository.RoleRepository;
import kz.pmproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TokenService tokenService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final ActionTokenService actionTokenService;
    private final AuthMailService authMailService;
    private final AuthProperties authProperties;
    private final OpaqueTokenRepository opaqueTokenRepository;

    @Transactional
    public Map<String, Object> login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        upgradeLegacyPasswordIfNeeded(user, request.getPassword());

        if (!user.isEmailVerified()) {
            sendVerificationEmail(user);
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Email is not confirmed yet. We sent a new confirmation link."
            );
        }

        String token = tokenService.createToken(user);
        return Map.of("token", token);
    }

    @Transactional
    public Map<String, Object> register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
        }

        Role userRole = roleRepository.findByName(RoleDic.USER.name())
                .orElseThrow(() -> new IllegalStateException("USER role not found"));

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .enabled(true)
                .emailVerified(false)
                .roles(Set.of(userRole))
                .build();

        userRepository.save(user);

        try {
            sendVerificationEmail(user);
        } catch (Exception e) {
            System.out.println("Verification email sending failed: " + e.getMessage());
        }

        return Map.of(
                "message", "Account created. Please check your email to confirm it before signing in.",
                "email", user.getEmail(),
                "requiresEmailVerification", true
        );
    }

    @Transactional
    public Map<String, Object> verifyEmail(String tokenValue) {
        EmailActionToken token = actionTokenService.requireActiveToken(
                tokenValue,
                EmailActionTokenPurpose.EMAIL_VERIFICATION,
                "Verification link is invalid or expired"
        );

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setEmailVerified(true);
        userRepository.save(user);
        actionTokenService.markUsed(token);

        return Map.of("message", "Email confirmed successfully. You can sign in now.");
    }

    @Transactional
    public Map<String, Object> resendVerification(EmailRequest request) {
        userRepository.findByEmail(request.getEmail())
                .filter(user -> !user.isEmailVerified())
                .ifPresent(this::sendVerificationEmail);

        return Map.of("message", "If an account with that email exists, a confirmation link has been sent.");
    }

    @Transactional
    public Map<String, Object> forgotPassword(EmailRequest request) {
        userRepository.findByEmail(request.getEmail())
                .ifPresent(this::sendPasswordResetEmail);

        return Map.of("message", "If an account with that email exists, a password reset link has been sent.");
    }

    @Transactional
    public Map<String, Object> resetPassword(ResetPasswordRequest request) {
        EmailActionToken token = actionTokenService.requireActiveToken(
                request.getToken(),
                EmailActionTokenPurpose.PASSWORD_RESET,
                "Password reset link is invalid or expired"
        );

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);
        actionTokenService.markUsed(token);
        revokeUserSessions(user.getId());

        return Map.of("message", "Password updated successfully. Sign in with your new password.");
    }

    private void sendVerificationEmail(User user) {
        EmailActionToken token = actionTokenService.createToken(
                user,
                EmailActionTokenPurpose.EMAIL_VERIFICATION,
                Duration.ofHours(authProperties.getVerificationTtlHours())
        );

        authMailService.sendEmailVerification(user, token.getToken(), token.getExpiresAt());
    }

    private void sendPasswordResetEmail(User user) {
        EmailActionToken token = actionTokenService.createToken(
                user,
                EmailActionTokenPurpose.PASSWORD_RESET,
                Duration.ofMinutes(authProperties.getPasswordResetTtlMinutes())
        );

        authMailService.sendPasswordReset(user, token.getToken(), token.getExpiresAt());
    }

    private void revokeUserSessions(Long userId) {
        List<OpaqueToken> sessions = opaqueTokenRepository.findAllByUserIdAndRevokedFalse(userId);

        if (sessions.isEmpty()) {
            return;
        }

        for (OpaqueToken session : sessions) {
            session.setRevoked(true);
        }

        opaqueTokenRepository.saveAll(sessions);
    }

    private void upgradeLegacyPasswordIfNeeded(User user, String rawPassword) {
        String storedPassword = user.getPassword();

        if (storedPassword == null
                || storedPassword.startsWith("$2a$")
                || storedPassword.startsWith("$2b$")
                || storedPassword.startsWith("$2y$")) {
            return;
        }

        user.setPassword(passwordEncoder.encode(rawPassword));
        userRepository.save(user);
    }
}

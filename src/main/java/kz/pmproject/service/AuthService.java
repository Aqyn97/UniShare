package kz.pmproject.service;

import kz.pmproject.model.user.dto.EmailRequest;
import kz.pmproject.model.user.dto.LoginRequest;
import kz.pmproject.model.user.dto.RegisterRequest;
import kz.pmproject.model.user.dto.ResetPasswordRequest;
import kz.pmproject.model.user.entity.Role;
import kz.pmproject.model.user.entity.User;
import kz.pmproject.repository.RoleRepository;
import kz.pmproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @Transactional
    public Map<String, Object> login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account disabled");
        }

        String token = tokenService.createToken(user);
        return Map.of("token", token, "username", user.getUsername());
    }

    @Transactional
    public Map<String, Object> register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new IllegalStateException("USER role not seeded in DB"));

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .emailVerified(true)
                .enabled(true)
                .roles(Set.of(userRole))
                .build();

        userRepository.save(user);
        String token = tokenService.createToken(user);
        return Map.of("token", token, "username", user.getUsername(), "requiresEmailVerification", false);
    }

    // TODO: Implement email verification flow (send token via email, validate on click)
    public Map<String, Object> verifyEmail(String token) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                "Email verification not yet implemented");
    }

    // TODO: Implement resend verification email flow
    public Map<String, Object> resendVerification(EmailRequest request) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                "Resend verification not yet implemented");
    }

    // TODO: Implement forgot-password flow (generate reset token, send via email)
    public Map<String, Object> forgotPassword(EmailRequest request) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                "Forgot password not yet implemented");
    }

    // TODO: Implement password reset (validate reset token, update password hash)
    public Map<String, Object> resetPassword(ResetPasswordRequest request) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                "Reset password not yet implemented");
    }
}

package kz.pmproject.controller;

import jakarta.validation.Valid;
import kz.pmproject.model.user.data.TokenPrincipal;
import kz.pmproject.model.user.dto.CurrentUserResponse;
import kz.pmproject.model.user.dto.EmailRequest;
import kz.pmproject.model.user.dto.LoginRequest;
import kz.pmproject.model.user.dto.RegisterRequest;
import kz.pmproject.model.user.dto.ResetPasswordRequest;
import kz.pmproject.model.user.entity.Role;
import kz.pmproject.model.user.entity.User;
import kz.pmproject.repository.UserRepository;
import kz.pmproject.service.AuthService;
import kz.pmproject.service.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TokenService tokenService;
    private final UserRepository userRepository;

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "x-session", required = false) String token) {
        if (token != null && !token.isBlank()) {
            tokenService.revokeToken(token);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestParam String token) {
        return ResponseEntity.ok(authService.verifyEmail(token));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, Object>> resendVerification(@Valid @RequestBody EmailRequest request) {
        return ResponseEntity.ok(authService.resendVerification(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@Valid @RequestBody EmailRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public ResponseEntity<CurrentUserResponse> me(@AuthenticationPrincipal TokenPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }

        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));

        CurrentUserResponse response = CurrentUserResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .emailVerified(user.isEmailVerified())
                .enabled(user.isEnabled())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .permissions(principal.getPermissions())
                .build();

        return ResponseEntity.ok(response);
    }
}

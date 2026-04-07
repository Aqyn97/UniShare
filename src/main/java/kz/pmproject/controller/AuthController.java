package kz.pmproject.controller;

import jakarta.validation.Valid;
import kz.pmproject.model.user.data.TokenPrincipal;
import kz.pmproject.model.user.dto.CurrentUserResponse;
import kz.pmproject.model.user.dto.LoginRequest;
import kz.pmproject.model.user.dto.RegisterRequest;
import kz.pmproject.model.user.entity.Role;
import kz.pmproject.model.user.entity.User;
import kz.pmproject.model.user.enums.RoleDic;
import kz.pmproject.repository.RoleRepository;
import kz.pmproject.repository.UserRepository;
import kz.pmproject.service.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final TokenService tokenService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        User byUsername = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), byUsername.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String token = tokenService.createToken(byUsername);

        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Username already exists"));
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email already exists"));
        }

        Role userRole = roleRepository.findByName(RoleDic.USER.name())
                .orElseThrow(() -> new RuntimeException("USER role not found"));

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .enabled(true)
                .roles(Set.of(userRole))
                .build();

        userRepository.save(user);

        String token = tokenService.createToken(user);

        Map<String, Object> response = Map.of(
                "message", "User registered successfully",
                "token", token,
                "username", request.getUsername(),
                "email", request.getEmail()
        );

        return ResponseEntity.ok(response);
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
                .enabled(user.isEnabled())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .permissions(principal.getPermissions())
                .build();

        return ResponseEntity.ok(response);
    }
}


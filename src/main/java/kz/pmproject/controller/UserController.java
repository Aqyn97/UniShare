package kz.pmproject.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import kz.pmproject.model.user.entity.User;
import kz.pmproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@Tag(name = "Users API", description = "Управление пользователями")
@RequestMapping("/users")
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @PreAuthorize("@authorization.hasAccessToReadUser()")
    @GetMapping
    @Transactional
    public ResponseEntity<User> getUser(@RequestParam String username) {
        Optional<User> byId = userRepository.findByUsername(username);
        return byId.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}

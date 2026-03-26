package kz.pmproject.controller;

import jakarta.validation.Valid;
import kz.pmproject.model.market.dto.ReviewCreateRequest;
import kz.pmproject.model.market.dto.ReviewResponse;
import kz.pmproject.model.user.data.TokenPrincipal;
import kz.pmproject.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/reviews")
    public ResponseEntity<ReviewResponse> create(
            @Valid @RequestBody ReviewCreateRequest request,
            @AuthenticationPrincipal TokenPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.create(principal.getUserId(), request));
    }

    @GetMapping("/users/{userId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getUserReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getUserReviews(userId));
    }

    @GetMapping("/items/{itemId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getItemReviews(@PathVariable Long itemId) {
        return ResponseEntity.ok(reviewService.getItemReviews(itemId));
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal TokenPrincipal principal
    ) {
        reviewService.delete(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}

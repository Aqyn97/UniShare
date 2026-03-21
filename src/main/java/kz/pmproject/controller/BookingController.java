package kz.pmproject.controller;

import jakarta.validation.Valid;
import kz.pmproject.model.market.dto.BookingRequest;
import kz.pmproject.model.market.entity.Booking;
import kz.pmproject.model.market.entity.Booking.BookingStatus;
import kz.pmproject.model.user.data.TokenPrincipal;
import kz.pmproject.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<Booking> create(
            @Valid @RequestBody BookingRequest request,
            @AuthenticationPrincipal TokenPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.create(principal.getUserId(), request));
    }

    @GetMapping
    public ResponseEntity<List<Booking>> list(
            @RequestParam(defaultValue = "renter") String role,
            @RequestParam(required = false) BookingStatus status,
            @AuthenticationPrincipal TokenPrincipal principal
    ) {
        return ResponseEntity.ok(bookingService.list(principal.getUserId(), role, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getOne(
            @PathVariable Long id,
            @AuthenticationPrincipal TokenPrincipal principal
    ) {
        return ResponseEntity.ok(bookingService.getOne(id, principal.getUserId()));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Booking> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal TokenPrincipal principal
    ) {
        return ResponseEntity.ok(bookingService.approve(id, principal.getUserId()));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Booking> reject(
            @PathVariable Long id,
            @AuthenticationPrincipal TokenPrincipal principal
    ) {
        return ResponseEntity.ok(bookingService.reject(id, principal.getUserId()));
    }

    @PostMapping("/{id}/handover")
    public ResponseEntity<Booking> handover(
            @PathVariable Long id,
            @AuthenticationPrincipal TokenPrincipal principal
    ) {
        return ResponseEntity.ok(bookingService.handover(id, principal.getUserId()));
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<Booking> returnItem(
            @PathVariable Long id,
            @AuthenticationPrincipal TokenPrincipal principal
    ) {
        return ResponseEntity.ok(bookingService.returnItem(id, principal.getUserId()));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal TokenPrincipal principal
    ) {
        return ResponseEntity.ok(bookingService.cancel(id, principal.getUserId()));
    }
}
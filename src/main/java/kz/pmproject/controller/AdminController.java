package kz.pmproject.controller;

import kz.pmproject.model.market.dto.AdminItemResponse;
import kz.pmproject.model.market.dto.AdminStatsResponse;
import kz.pmproject.model.market.entity.Booking;
import kz.pmproject.model.market.entity.Item;
import kz.pmproject.model.user.entity.User;
import kz.pmproject.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("@authorization.isAdmin()")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(adminService.getUsers());
    }

    @PatchMapping("/users/{id}/ban")
    public ResponseEntity<User> banUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.banUser(id));
    }

    @PatchMapping("/users/{id}/unban")
    public ResponseEntity<User> unbanUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.unbanUser(id));
    }

    @GetMapping("/items")
    public ResponseEntity<List<AdminItemResponse>> getItems() {
        return ResponseEntity.ok(adminService.getItems());
    }

    @PatchMapping("/items/{id}/hide")
    public ResponseEntity<Item> hideItem(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.hideItem(id));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getBookings() {
        return ResponseEntity.ok(adminService.getBookings());
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }
}
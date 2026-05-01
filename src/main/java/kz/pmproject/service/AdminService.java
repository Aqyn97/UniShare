package kz.pmproject.service;

import kz.pmproject.model.market.dto.AdminItemResponse;
import kz.pmproject.model.market.dto.AdminStatsResponse;
import kz.pmproject.model.market.entity.Booking;
import kz.pmproject.model.market.entity.Item;
import kz.pmproject.model.market.entity.Review;
import kz.pmproject.model.user.entity.User;
import kz.pmproject.repository.BookingRepository;
import kz.pmproject.repository.ItemRepository;
import kz.pmproject.repository.ReviewRepository;
import kz.pmproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public User banUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setEnabled(false);
        return userRepository.save(user);
    }

    @Transactional
    public User unbanUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setEnabled(true);
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<AdminItemResponse> getItems() {
        return itemRepository.findAll().stream()
                .map(item -> AdminItemResponse.builder()
                        .id(item.getId())
                        .ownerId(item.getOwner() != null ? item.getOwner().getId() : null)
                        .ownerUsername(item.getOwner() != null ? item.getOwner().getUsername() : null)
                        .categoryId(item.getCategory() != null ? item.getCategory().getId() : null)
                        .categoryName(item.getCategory() != null ? item.getCategory().getName() : null)
                        .title(item.getTitle())
                        .description(item.getDescription())
                        .price(item.getPrice())
                        .currency(item.getCurrency())
                        .published(item.isPublished())
                        .createdAt(item.getCreatedAt())
                        .updatedAt(item.getUpdatedAt())
                        .build())
                .toList();
    }

    @Transactional
    public Item hideItem(Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        item.setPublished(false);
        return itemRepository.save(item);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookings() {
        return bookingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        long usersCount = userRepository.count();
        long itemsCount = itemRepository.count();
        long bookingsCount = bookingRepository.count();
        long reviewsCount = reviewRepository.count();

        double avg = reviewRepository.findAll()
                .stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

        return AdminStatsResponse.builder()
                .usersCount(usersCount)
                .itemsCount(itemsCount)
                .bookingsCount(bookingsCount)
                .reviewsCount(reviewsCount)
                .averageRating(Math.round(avg * 100.0) / 100.0)
                .build();
    }
}
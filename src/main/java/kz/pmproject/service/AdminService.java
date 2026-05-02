package kz.pmproject.service;

import kz.pmproject.model.market.dto.AdminBookingResponse;
import kz.pmproject.model.market.dto.AdminItemResponse;
import kz.pmproject.model.market.dto.AdminStatsResponse;
import kz.pmproject.model.market.dto.AdminUserResponse;
import kz.pmproject.model.market.entity.Booking;
import kz.pmproject.model.market.entity.Item;
import kz.pmproject.model.market.entity.Review;
import kz.pmproject.model.user.entity.User;
import kz.pmproject.repository.BookingRepository;
import kz.pmproject.repository.ItemRatingSummary;
import kz.pmproject.repository.ItemRepository;
import kz.pmproject.repository.ReviewRepository;
import kz.pmproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

import static java.util.stream.Collectors.toMap;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers() {
        return userRepository.findAll().stream()
                .map(this::toAdminUserResponse)
                .toList();
    }

    @Transactional
    public AdminUserResponse banUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setEnabled(false);
        return toAdminUserResponse(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse unbanUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setEnabled(true);
        return toAdminUserResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<AdminItemResponse> getItems() {
        List<Item> items = itemRepository.findAll();
        List<Long> itemIds = items.stream().map(Item::getId).toList();
        Map<Long, ItemRatingSummary> ratingsByItemId = itemIds.isEmpty()
                ? Map.of()
                : reviewRepository.summarizeByItemIds(itemIds).stream()
                .collect(toMap(ItemRatingSummary::getItemId, Function.identity()));

        return items.stream()
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
                        .ratingAvg(roundRating(ratingsByItemId.get(item.getId()) == null
                                ? null
                                : ratingsByItemId.get(item.getId()).getRatingAvg()))
                        .ratingCount(ratingsByItemId.get(item.getId()) == null
                                ? 0
                                : ratingsByItemId.get(item.getId()).getRatingCount())
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
    public List<AdminBookingResponse> getBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        Map<Long, Item> itemsById = itemRepository.findAllById(
                bookings.stream().map(Booking::getItemId).distinct().toList()
        ).stream().collect(toMap(Item::getId, Function.identity()));
        Map<Long, User> usersById = userRepository.findAllById(
                bookings.stream()
                        .flatMap(booking -> java.util.stream.Stream.of(booking.getRenterId(), booking.getOwnerId()))
                        .distinct()
                        .toList()
        ).stream().collect(toMap(User::getId, Function.identity()));

        return bookings.stream()
                .map(booking -> toAdminBookingResponse(
                        booking,
                        itemsById.get(booking.getItemId()),
                        usersById.get(booking.getRenterId()),
                        usersById.get(booking.getOwnerId())
                ))
                .toList();
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
                .averageRating(reviewsCount == 0 ? null : Math.round(avg * 100.0) / 100.0)
                .build();
    }

    private AdminUserResponse toAdminUserResponse(User user) {
        Set<String> roles = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(java.util.stream.Collectors.toSet());

        return AdminUserResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .enabled(user.isEnabled())
                .roles(roles)
                .createdAt(user.getCreatedAt())
                .ratingAvg(user.getRatingAvg())
                .ratingCount(user.getRatingCount())
                .build();
    }

    private AdminBookingResponse toAdminBookingResponse(Booking booking, Item item, User renter, User owner) {
        return AdminBookingResponse.builder()
                .id(booking.getId())
                .itemId(booking.getItemId())
                .itemTitle(item == null ? null : item.getTitle())
                .renterId(booking.getRenterId())
                .renterUsername(renter == null ? null : renter.getUsername())
                .ownerId(booking.getOwnerId())
                .ownerUsername(owner == null ? null : owner.getUsername())
                .dateFrom(booking.getDateFrom())
                .dateTo(booking.getDateTo())
                .status(booking.getStatus())
                .totalPrice(booking.getTotalPrice())
                .createdAt(booking.getCreatedAt())
                .build();
    }

    private BigDecimal roundRating(Double ratingAvg) {
        if (ratingAvg == null) {
            return null;
        }
        return BigDecimal.valueOf(ratingAvg).setScale(2, RoundingMode.HALF_UP);
    }
}

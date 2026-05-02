package kz.pmproject.service;

import kz.pmproject.model.market.dto.ReviewCreateRequest;
import kz.pmproject.model.market.dto.ReviewResponse;
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

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final AuthorizationService authorizationService;

    @Transactional
    public ReviewResponse create(Long currentUserId, ReviewCreateRequest request) {
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));

        if (!item.isPublished()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can review only published items");
        }

        if (item.getOwner().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot review your own item");
        }

        boolean hasCompletedBooking = bookingRepository.existsByRenterIdAndItemIdAndStatus(
                currentUserId,
                item.getId(),
                Booking.BookingStatus.COMPLETED
        );
        if (!hasCompletedBooking) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only users who completed a booking for this item can leave a review"
            );
        }

        if (reviewRepository.existsByItemIdAndAuthorId(request.getItemId(), currentUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You have already reviewed this item");
        }

        Review review = Review.builder()
                .bookingId(null)
                .itemId(item.getId())
                .authorId(currentUserId)
                .targetUserId(item.getOwner().getId())
                .rating(request.getRating())
                .comment(normalizeComment(request.getComment()))
                .build();

        Review saved = reviewRepository.save(review);

        recalculateUserRating(item.getOwner().getId());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getUserReviews(Long userId) {
        return reviewRepository.findByTargetUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getItemReviews(Long itemId) {
        return reviewRepository.findByItemIdOrderByCreatedAtDesc(itemId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void delete(Long reviewId, Long currentUserId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        boolean canDelete = review.getAuthorId().equals(currentUserId) || authorizationService.isAdmin();
        if (!canDelete) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot delete this review");
        }

        Long targetUserId = review.getTargetUserId();
        reviewRepository.delete(review);
        recalculateUserRating(targetUserId);
    }

    private void recalculateUserRating(Long userId) {
        List<Review> reviews = reviewRepository.findByTargetUserId(userId);

        double avg = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setRatingAvg(reviews.isEmpty() ? null : BigDecimal.valueOf(Math.round(avg * 100.0) / 100.0));
        user.setRatingCount(reviews.size());
        userRepository.save(user);
    }

    private String normalizeComment(String comment) {
        if (comment == null) {
            return null;
        }
        String trimmed = comment.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ReviewResponse toResponse(Review review) {
        String authorUsername = userRepository.findById(review.getAuthorId())
                .map(User::getUsername)
                .orElse(null);

        return ReviewResponse.builder()
                .id(review.getId())
                .bookingId(review.getBookingId())
                .itemId(review.getItemId())
                .authorId(review.getAuthorId())
                .authorUsername(authorUsername)
                .targetUserId(review.getTargetUserId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}

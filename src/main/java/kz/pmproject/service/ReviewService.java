package kz.pmproject.service;

import kz.pmproject.model.market.dto.ReviewCreateRequest;
import kz.pmproject.model.market.dto.ReviewResponse;
import kz.pmproject.model.market.entity.Booking;
import kz.pmproject.model.market.entity.Review;
import kz.pmproject.model.user.entity.User;
import kz.pmproject.repository.BookingRepository;
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

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final AuthorizationService authorizationService;

    @Transactional
    public ReviewResponse create(Long currentUserId, ReviewCreateRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (!booking.getRenterId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only renter can leave review");
        }

        if (booking.getStatus() != Booking.BookingStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review allowed only for completed booking");
        }

        if (reviewRepository.existsByBookingIdAndAuthorId(request.getBookingId(), currentUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review already exists for this booking");
        }

        if (booking.getOwnerId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot review yourself");
        }

        Review review = Review.builder()
                .bookingId(booking.getId())
                .itemId(booking.getItemId())
                .authorId(currentUserId)
                .targetUserId(booking.getOwnerId())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review saved = reviewRepository.save(review);

        recalculateUserRating(booking.getOwnerId());

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

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .bookingId(review.getBookingId())
                .itemId(review.getItemId())
                .authorId(review.getAuthorId())
                .targetUserId(review.getTargetUserId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
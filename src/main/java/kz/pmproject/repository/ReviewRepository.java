package kz.pmproject.repository;

import kz.pmproject.model.market.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId);

    List<Review> findByItemIdOrderByCreatedAtDesc(Long itemId);

    boolean existsByBookingIdAndAuthorId(Long bookingId, Long authorId);

    List<Review> findByTargetUserId(Long targetUserId);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r")
    double findAverageRating();
}
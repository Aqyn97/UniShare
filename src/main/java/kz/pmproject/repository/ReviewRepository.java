package kz.pmproject.repository;

import kz.pmproject.model.market.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId);

    List<Review> findByItemIdOrderByCreatedAtDesc(Long itemId);

    boolean existsByBookingIdAndAuthorId(Long bookingId, Long authorId);

    long countBy();

    List<Review> findByTargetUserId(Long targetUserId);
}
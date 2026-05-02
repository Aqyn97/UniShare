package kz.pmproject.repository;

import kz.pmproject.model.market.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId);

    List<Review> findByItemIdOrderByCreatedAtDesc(Long itemId);

    boolean existsByItemIdAndAuthorId(Long itemId, Long authorId);

    long countBy();

    List<Review> findByTargetUserId(Long targetUserId);

    @Query("""
            select r.itemId as itemId,
                   avg(r.rating) as ratingAvg,
                   count(r) as ratingCount
            from Review r
            where r.itemId in :itemIds
            group by r.itemId
            """)
    List<ItemRatingSummary> summarizeByItemIds(Collection<Long> itemIds);

    @Query("""
            select avg(r.rating)
            from Review r
            where r.itemId = :itemId
            """)
    Double findAverageRatingByItemId(Long itemId);

    long countByItemId(Long itemId);
}

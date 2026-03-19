package kz.pmproject.repository;

import kz.pmproject.model.market.entity.ItemAvailabilityBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemAvailabilityBlockRepository extends JpaRepository<ItemAvailabilityBlock, Long> {
    List<ItemAvailabilityBlock> findByItemIdOrderByStartDateAsc(Long itemId);
    void deleteByItemId(Long itemId);
}

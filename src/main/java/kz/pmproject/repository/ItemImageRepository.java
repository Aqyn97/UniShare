package kz.pmproject.repository;

import kz.pmproject.model.market.entity.ItemImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemImageRepository extends JpaRepository<ItemImage, Long> {
    List<ItemImage> findByItemIdOrderByIdAsc(Long itemId);
    void deleteByIdAndItemId(Long id, Long itemId);
}

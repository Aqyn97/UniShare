package com.example.demo.repository;

import com.example.demo.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    // Advanced search: Finds items by keyword in title/desc AND optionally filters by category
    @Query("SELECT i FROM Item i WHERE " +
            "(:categoryId IS NULL OR i.category.id = :categoryId) AND " +
            "(LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Item> searchItems(@Param("categoryId") Long categoryId, @Param("keyword") String keyword);

    List<Item> findByOwnerId(Long ownerId);
}
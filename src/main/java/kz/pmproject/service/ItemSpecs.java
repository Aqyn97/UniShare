package kz.pmproject.service;

import kz.pmproject.model.market.entity.Item;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

public final class ItemSpecs {
    private ItemSpecs() {}

    public static Specification<Item> published(Boolean published) {
        if (published == null) return null;
        return (root, query, cb) -> cb.equal(root.get("published"), published);
    }

    public static Specification<Item> categoryId(Long categoryId) {
        if (categoryId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId);
    }

    public static Specification<Item> minPrice(BigDecimal minPrice) {
        if (minPrice == null) return null;
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("price"), minPrice);
    }

    public static Specification<Item> maxPrice(BigDecimal maxPrice) {
        if (maxPrice == null) return null;
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), maxPrice);
    }

    public static Specification<Item> search(String q) {
        if (q == null || q.isBlank()) return null;
        String like = "%" + q.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), like),
                cb.like(cb.lower(root.get("description")), like)
        );
    }
}


package kz.pmproject.service;

import kz.pmproject.model.market.dto.ItemImageResponse;
import kz.pmproject.model.market.dto.ItemResponse;
import kz.pmproject.model.market.entity.Item;
import kz.pmproject.model.market.entity.ItemImage;
import kz.pmproject.repository.ItemRatingSummary;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Component
public class ItemMapper {
    public ItemResponse toResponse(Item item, List<ItemImage> images, Double ratingAvg, long ratingCount) {
        return ItemResponse.builder()
                .id(item.getId())
                .ownerId(item.getOwner().getId())
                .ownerUsername(item.getOwner().getUsername())
                .categoryId(item.getCategory() == null ? null : item.getCategory().getId())
                .categoryName(item.getCategory() == null ? null : item.getCategory().getName())
                .title(item.getTitle())
                .description(item.getDescription())
                .price(item.getPrice())
                .currency(item.getCurrency())
                .published(item.isPublished())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .ratingAvg(roundRating(ratingAvg))
                .ratingCount(ratingCount)
                .images(images == null ? List.of() : images.stream().map(this::toImageResponse).toList())
                .build();
    }

    public ItemResponse toResponse(Item item, List<ItemImage> images, ItemRatingSummary ratingSummary) {
        return toResponse(
                item,
                images,
                ratingSummary == null ? null : ratingSummary.getRatingAvg(),
                ratingSummary == null ? 0 : ratingSummary.getRatingCount()
        );
    }

    public ItemImageResponse toImageResponse(ItemImage img) {
        return ItemImageResponse.builder()
                .id(img.getId())
                .publicId(img.getCloudinaryPublicId())
                .url(img.getUrl())
                .createdAt(img.getCreatedAt())
                .build();
    }

    private BigDecimal roundRating(Double ratingAvg) {
        if (ratingAvg == null) {
            return null;
        }
        return BigDecimal.valueOf(ratingAvg).setScale(2, RoundingMode.HALF_UP);
    }
}


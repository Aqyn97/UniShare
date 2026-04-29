package kz.pmproject.service;

import kz.pmproject.model.market.dto.ItemImageResponse;
import kz.pmproject.model.market.dto.ItemResponse;
import kz.pmproject.model.market.entity.Item;
import kz.pmproject.model.market.entity.ItemImage;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ItemMapper {
    public ItemResponse toResponse(Item item, List<ItemImage> images) {
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
                .images(images == null ? List.of() : images.stream().map(this::toImageResponse).toList())
                .build();
    }

    public ItemImageResponse toImageResponse(ItemImage img) {
        return ItemImageResponse.builder()
                .id(img.getId())
                .publicId(img.getCloudinaryPublicId())
                .url(img.getUrl())
                .createdAt(img.getCreatedAt())
                .build();
    }
}


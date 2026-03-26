package kz.pmproject.model.market.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminItemResponse {
    private Long id;
    private Long ownerId;
    private String ownerUsername;
    private Long categoryId;
    private String categoryName;
    private String title;
    private String description;
    private BigDecimal price;
    private String currency;
    private boolean published;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
package kz.pmproject.model.market.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ItemImageResponse {
    private Long id;
    private String publicId;
    private String url;
    private LocalDateTime createdAt;
}


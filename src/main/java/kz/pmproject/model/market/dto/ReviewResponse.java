package kz.pmproject.model.market.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Long bookingId;
    private Long itemId;
    private Long authorId;
    private Long targetUserId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
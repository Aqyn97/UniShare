package kz.pmproject.model.market.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminStatsResponse {
    private long usersCount;
    private long itemsCount;
    private long bookingsCount;
    private long reviewsCount;
    private double averageRating;
}
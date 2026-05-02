package kz.pmproject.model.market.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class AvailabilityWindowResponse {
    private LocalDate startDate;
    private LocalDate endDate;
    private String source;
}

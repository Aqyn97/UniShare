package kz.pmproject.model.market.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AvailabilityBlockDto {
    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;
}


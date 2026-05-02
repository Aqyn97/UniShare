package kz.pmproject.model.market.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter
public class BookingRequest {

    @NotNull
    private Long itemId;

    @NotNull
    @FutureOrPresent
    private LocalDate dateFrom;

    @NotNull
    @FutureOrPresent
    private LocalDate dateTo;

    private String renterNote;
}

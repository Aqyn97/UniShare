package kz.pmproject.model.market.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter @Setter
public class BookingRequest {

    @NotNull
    private Long itemId;

    @NotNull
    @Future
    private LocalDate dateFrom;

    @NotNull
    @Future
    private LocalDate dateTo;

    private String renterNote;
}
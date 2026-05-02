package kz.pmproject.model.market.dto;

import kz.pmproject.model.market.entity.Booking.BookingStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminBookingResponse {
    private Long id;
    private Long itemId;
    private String itemTitle;
    private Long renterId;
    private String renterUsername;
    private Long ownerId;
    private String ownerUsername;
    private LocalDate dateFrom;
    private LocalDate dateTo;
    private BookingStatus status;
    private BigDecimal totalPrice;
    private LocalDateTime createdAt;
}

package kz.pmproject.model.market.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ItemUpdateRequest {
    private Long categoryId;

    @Size(max = 200)
    private String title;

    private String description;

    private BigDecimal price;

    @Size(max = 10)
    private String currency;
}

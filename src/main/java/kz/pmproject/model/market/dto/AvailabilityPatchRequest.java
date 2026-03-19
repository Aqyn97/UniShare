package kz.pmproject.model.market.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class AvailabilityPatchRequest {
    @NotNull
    @Valid
    private List<AvailabilityBlockDto> blocks;
}


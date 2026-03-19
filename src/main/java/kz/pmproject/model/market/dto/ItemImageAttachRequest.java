package kz.pmproject.model.market.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ItemImageAttachRequest {
    @NotBlank
    @Size(max = 255)
    private String publicId;

    @NotBlank
    private String url;
}


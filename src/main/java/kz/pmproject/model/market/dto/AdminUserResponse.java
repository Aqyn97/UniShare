package kz.pmproject.model.market.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
public class AdminUserResponse {
    private Long userId;
    private String username;
    private String email;
    private boolean enabled;
    private Set<String> roles;
    private LocalDateTime createdAt;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
}

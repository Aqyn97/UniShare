package kz.pmproject.model.user.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class CurrentUserResponse {
    private Long userId;
    private String username;
    private String email;
    private boolean enabled;
    private Set<String> roles;
    private Set<String> permissions;
}

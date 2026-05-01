package kz.pmproject.model.user.dto;

import java.time.LocalDateTime;

public class UserDto {

    private String username;
    private String password;
    private String email;
    private boolean enabled = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

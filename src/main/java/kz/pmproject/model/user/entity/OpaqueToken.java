package kz.pmproject.model.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "opaque_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpaqueToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String token;

    @Column(name = "user_id")
    private Long userId;

    private LocalDateTime expiresAt;

    private boolean revoked = false;
}

package kz.pmproject.repository;

import kz.pmproject.model.user.entity.OpaqueToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OpaqueTokenRepository extends JpaRepository<OpaqueToken, String> {

    Optional<OpaqueToken> findByToken(String token);
}

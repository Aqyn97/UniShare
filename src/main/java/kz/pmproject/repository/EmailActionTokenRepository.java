package kz.pmproject.repository;

import kz.pmproject.model.user.entity.EmailActionToken;
import kz.pmproject.model.user.enums.EmailActionTokenPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailActionTokenRepository extends JpaRepository<EmailActionToken, Long> {
    Optional<EmailActionToken> findByTokenAndPurpose(String token, EmailActionTokenPurpose purpose);

    List<EmailActionToken> findAllByUserIdAndPurposeAndUsedAtIsNullAndRevokedFalse(
            Long userId,
            EmailActionTokenPurpose purpose
    );
}

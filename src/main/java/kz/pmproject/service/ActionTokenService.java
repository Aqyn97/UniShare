package kz.pmproject.service;

import kz.pmproject.model.user.entity.EmailActionToken;
import kz.pmproject.model.user.entity.User;
import kz.pmproject.model.user.enums.EmailActionTokenPurpose;
import kz.pmproject.repository.EmailActionTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActionTokenService {

    private final EmailActionTokenRepository emailActionTokenRepository;

    @Transactional
    public EmailActionToken createToken(User user, EmailActionTokenPurpose purpose, Duration ttl) {
        revokeActiveTokens(user.getId(), purpose);

        EmailActionToken token = EmailActionToken.builder()
                .token(UUID.randomUUID().toString())
                .userId(user.getId())
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plus(ttl))
                .build();

        return emailActionTokenRepository.save(token);
    }

    @Transactional(readOnly = true)
    public EmailActionToken requireActiveToken(String tokenValue, EmailActionTokenPurpose purpose, String invalidMessage) {
        EmailActionToken token = emailActionTokenRepository.findByTokenAndPurpose(tokenValue, purpose)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, invalidMessage));

        if (token.isRevoked() || token.getUsedAt() != null || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, invalidMessage);
        }

        return token;
    }

    @Transactional
    public void markUsed(EmailActionToken token) {
        token.setUsedAt(LocalDateTime.now());
        emailActionTokenRepository.save(token);
    }

    @Transactional
    public void revokeActiveTokens(Long userId, EmailActionTokenPurpose purpose) {
        List<EmailActionToken> tokens = emailActionTokenRepository
                .findAllByUserIdAndPurposeAndUsedAtIsNullAndRevokedFalse(userId, purpose);

        if (tokens.isEmpty()) {
            return;
        }

        for (EmailActionToken token : tokens) {
            token.setRevoked(true);
        }

        emailActionTokenRepository.saveAll(tokens);
    }
}

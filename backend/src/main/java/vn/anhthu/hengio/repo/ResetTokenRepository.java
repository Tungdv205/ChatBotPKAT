package vn.anhthu.hengio.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.anhthu.hengio.model.ResetToken;

public interface ResetTokenRepository extends JpaRepository<ResetToken, Long> {
    Optional<ResetToken> findByTokenHash(String tokenHash);

    void deleteByUserId(Long userId);
}
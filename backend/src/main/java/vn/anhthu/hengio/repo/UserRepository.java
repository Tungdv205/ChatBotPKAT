package vn.anhthu.hengio.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.anhthu.hengio.model.UserAccount;

public interface UserRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
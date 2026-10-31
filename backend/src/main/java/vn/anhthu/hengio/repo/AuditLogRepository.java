package vn.anhthu.hengio.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.anhthu.hengio.model.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop200ByOrderByCreatedAtDesc();
}
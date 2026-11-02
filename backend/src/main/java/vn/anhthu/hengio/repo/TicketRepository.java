package vn.anhthu.hengio.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.anhthu.hengio.model.SupportTicket;
import vn.anhthu.hengio.model.TicketStatus;

public interface TicketRepository extends JpaRepository<SupportTicket, String> {
    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndStatus(Long userId, TicketStatus status);

    long countByStatus(TicketStatus status);

    List<SupportTicket> findTop500ByOrderByCreatedAtDesc();

    void deleteByUserId(Long userId);
}
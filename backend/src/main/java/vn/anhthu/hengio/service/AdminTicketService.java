package vn.anhthu.hengio.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.anhthu.hengio.config.ApiException;
import vn.anhthu.hengio.model.SupportTicket;
import vn.anhthu.hengio.model.TicketStatus;
import vn.anhthu.hengio.model.UserAccount;
import vn.anhthu.hengio.repo.TicketRepository;
import vn.anhthu.hengio.repo.UserRepository;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.TicketAdmin;

/** Quản trị xem và trả lời yêu cầu hỗ trợ. Khách nhận thông báo kèm nội dung trả lời. */
@Service
public class AdminTicketService {
    private final TicketRepository tickets;
    private final UserRepository users;
    private final NotificationService notifs;
    private final AuditService audit;

    public AdminTicketService(TicketRepository tickets, UserRepository users, NotificationService notifs,
                              AuditService audit) {
        this.tickets = tickets;
        this.users = users;
        this.notifs = notifs;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<TicketAdmin> list(String status) {
        List<SupportTicket> all = tickets.findTop500ByOrderByCreatedAtDesc();
        Set<Long> ids = all.stream().map(SupportTicket::getUserId).collect(Collectors.toSet());
        Map<Long, UserAccount> byId = new HashMap<>();
        users.findAllById(ids).forEach(u -> byId.put(u.getId(), u));
        List<TicketAdmin> out = new ArrayList<>();
        for (SupportTicket t : all) {
            boolean done = t.getStatus() == TicketStatus.DONE;
            if ("open".equalsIgnoreCase(status) && done || "done".equalsIgnoreCase(status) && !done) {
                continue;
            }
            UserAccount u = byId.get(t.getUserId());
            out.add(new TicketAdmin(t.getId(), t.getTopic(), t.getMessage(), t.getCreatedAt().toEpochMilli(),
                    done ? TicketService.S_DONE : TicketService.S_OPEN, t.getReply(), t.getUserId(),
                    u == null ? "(đã xóa)" : u.getName(), u == null ? "" : AdminService.mask(u.getPhone())));
        }
        return out;
    }

    @Transactional
    public void reply(UserAccount admin, String id, String text) {
        SupportTicket t = tickets.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy yêu cầu."));
        t.setReply(text.trim());
        t.setStatus(TicketStatus.DONE);
        t.setRepliedAt(Instant.now());
        tickets.save(t);
        notifs.push(t.getUserId(), "system", "Phòng khám đã trả lời yêu cầu " + t.getId(), text.trim());
        audit.log(admin.getEmail(), "TRA_LOI_HO_TRO", t.getId(), null);
    }
}
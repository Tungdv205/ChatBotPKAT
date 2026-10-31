package vn.anhthu.hengio.service;

import java.security.SecureRandom;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.anhthu.hengio.config.ApiException;
import vn.anhthu.hengio.model.SupportTicket;
import vn.anhthu.hengio.model.TicketStatus;
import vn.anhthu.hengio.repo.TicketRepository;
import vn.anhthu.hengio.web.dto.TicketDtos.TicketDto;
import vn.anhthu.hengio.web.dto.TicketDtos.TicketReq;

/** Yêu cầu hỗ trợ của khách. Phần nhân viên trả lời sẽ làm ở phần quản trị. */
@Service
public class TicketService {
    static final String S_OPEN = "Đã tiếp nhận";
    static final String S_DONE = "Đã xử lý";
    static final int MAX_OPEN = 10; // mỗi khách tối đa 10 yêu cầu đang chờ, tránh gửi hàng loạt

    private final TicketRepository tickets;
    private final NotificationService notifs;
    private final SecureRandom random = new SecureRandom();

    public TicketService(TicketRepository tickets, NotificationService notifs) {
        this.tickets = tickets;
        this.notifs = notifs;
    }

    @Transactional(readOnly = true)
    public List<TicketDto> list(Long userId) {
        return tickets.findByUserIdOrderByCreatedAtDesc(userId).stream().map(TicketService::toDto).toList();
    }

    @Transactional
    public TicketDto create(Long userId, TicketReq r) {
        if (tickets.countByUserIdAndStatus(userId, TicketStatus.OPEN) >= MAX_OPEN) {
            throw ApiException.bad("Bạn đang có quá nhiều yêu cầu chờ xử lý. Vui lòng đợi phòng khám phản hồi.");
        }
        SupportTicket t = new SupportTicket();
        String id;
        do {
            id = "YC-" + (1000 + random.nextInt(9000));
        } while (tickets.existsById(id));
        t.setId(id);
        t.setUserId(userId);
        t.setTopic(r.topic().trim());
        t.setMessage(r.msg().trim());
        tickets.save(t);
        notifs.push(userId, "system", "Đã nhận yêu cầu hỗ trợ",
                "Mã " + id + ", chủ đề: " + t.getTopic() + ". Nhân viên sẽ phản hồi trong giờ làm việc.");
        return toDto(t);
    }

    static TicketDto toDto(SupportTicket t) {
        return new TicketDto(t.getId(), t.getTopic(), t.getMessage(), t.getCreatedAt().toEpochMilli(),
                t.getStatus() == TicketStatus.DONE ? S_DONE : S_OPEN, t.getReply());
    }
}
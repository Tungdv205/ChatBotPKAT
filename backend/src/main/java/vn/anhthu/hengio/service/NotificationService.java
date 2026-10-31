package vn.anhthu.hengio.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.anhthu.hengio.config.ApiException;
import vn.anhthu.hengio.model.Notification;
import vn.anhthu.hengio.repo.NotificationRepository;
import vn.anhthu.hengio.web.dto.NotificationDtos.NotifDto;

/** Gửi và đọc thông báo. Các service khác gọi push() để báo cho khách (đặt lịch, đổi lịch, hủy lịch, trả lời hỗ trợ...). */
@Service
public class NotificationService {
    private final NotificationRepository repo;

    public NotificationService(NotificationRepository repo) {
        this.repo = repo;
    }

    /** Tạo thông báo mới. Chạy cùng giao dịch với nơi gọi, nên lịch bị hủy bỏ thì thông báo cũng không còn. */
    @Transactional
    public void push(Long userId, String type, String title, String body) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type);
        n.setTitle(cut(title, 200));
        n.setBody(cut(body, 300));
        repo.save(n);
    }

    @Transactional(readOnly = true)
    public List<NotifDto> list(Long userId) {
        return repo.findTop100ByUserIdOrderByCreatedAtDesc(userId).stream().map(NotificationService::toDto).toList();
    }

    @Transactional
    public void markRead(Long userId, Long id) {
        Notification n = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy thông báo."));
        n.setSeen(true);
    }

    @Transactional
    public void markAllRead(Long userId) {
        repo.markAllSeen(userId);
    }

    private static String cut(String s, int max) {
        return s == null ? "" : (s.length() <= max ? s : s.substring(0, max - 1) + "…");
    }

    static NotifDto toDto(Notification n) {
        return new NotifDto(String.valueOf(n.getId()), n.getType(), n.getTitle(), n.getBody(),
                n.getCreatedAt().toEpochMilli(), n.isSeen());
    }
}
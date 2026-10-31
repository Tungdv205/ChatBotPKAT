package vn.anhthu.hengio.web;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.anhthu.hengio.model.UserAccount;
import vn.anhthu.hengio.service.NotificationService;
import vn.anhthu.hengio.web.dto.NotificationDtos.NotifDto;

/** Thông báo của người đang đăng nhập. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notifs;

    public NotificationController(NotificationService notifs) {
        this.notifs = notifs;
    }

    @GetMapping
    public List<NotifDto> list(@AuthenticationPrincipal UserAccount me) {
        return notifs.list(me.getId());
    }

    @PostMapping("/{id}/read")
    public Map<String, String> read(@AuthenticationPrincipal UserAccount me, @PathVariable Long id) {
        notifs.markRead(me.getId(), id);
        return Map.of("message", "ok");
    }

    @PostMapping("/read-all")
    public Map<String, String> readAll(@AuthenticationPrincipal UserAccount me) {
        notifs.markAllRead(me.getId());
        return Map.of("message", "ok");
    }
}
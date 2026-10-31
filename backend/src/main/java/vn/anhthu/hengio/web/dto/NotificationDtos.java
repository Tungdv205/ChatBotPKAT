package vn.anhthu.hengio.web.dto;

/** Thông báo trả cho giao diện: khớp trường của React (t, title, body, ts, read). */
public final class NotificationDtos {
    private NotificationDtos() {}

    public record NotifDto(String id, String t, String title, String body, long ts, boolean read) {}
}
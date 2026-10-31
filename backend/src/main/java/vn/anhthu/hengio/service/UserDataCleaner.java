package vn.anhthu.hengio.service;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.anhthu.hengio.repo.AppointmentRepository;
import vn.anhthu.hengio.repo.NotificationRepository;
import vn.anhthu.hengio.repo.TicketRepository;

/** Xóa toàn bộ dữ liệu cá nhân của một khách (lịch hẹn, thông báo, yêu cầu hỗ trợ) khi khách xóa tài khoản. */
@Component
public class UserDataCleaner {
    private final AppointmentRepository appointments;
    private final NotificationRepository notifications;
    private final TicketRepository tickets;

    public UserDataCleaner(AppointmentRepository appointments, NotificationRepository notifications,
                           TicketRepository tickets) {
        this.appointments = appointments;
        this.notifications = notifications;
        this.tickets = tickets;
    }

    @Transactional
    public void deleteAll(Long userId) {
        appointments.deleteByUserId(userId);
        notifications.deleteByUserId(userId);
        tickets.deleteByUserId(userId);
    }
}
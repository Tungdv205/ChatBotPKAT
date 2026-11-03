package vn.anhthu.hengio.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.anhthu.hengio.config.ApiException;
import vn.anhthu.hengio.model.Appointment;
import vn.anhthu.hengio.model.ApptStatus;
import vn.anhthu.hengio.model.Role;
import vn.anhthu.hengio.model.TicketStatus;
import vn.anhthu.hengio.model.UserAccount;
import vn.anhthu.hengio.repo.AppointmentRepository;
import vn.anhthu.hengio.repo.TicketRepository;
import vn.anhthu.hengio.repo.UserRepository;
import vn.anhthu.hengio.web.dto.AdminDtos.AdminApptDto;
import vn.anhthu.hengio.web.dto.AdminDtos.CustomerDetail;
import vn.anhthu.hengio.web.dto.AdminDtos.CustomerEditReq;
import vn.anhthu.hengio.web.dto.AdminDtos.CustomerRow;
import vn.anhthu.hengio.web.dto.AdminDtos.DayCount;
import vn.anhthu.hengio.web.dto.AdminDtos.PageRes;
import vn.anhthu.hengio.web.dto.AdminDtos.StatsRes;

/**
 * Nghiệp vụ quản trị: khách hàng, lịch hẹn, thống kê. Mọi thao tác thay đổi dữ liệu đều ghi nhật ký.
 * Quy tắc bảo mật: số điện thoại bị che trong danh sách; xem đủ thông tin một khách cũng được ghi nhật ký;
 * nhật ký không chứa dữ liệu cá nhân.
 */
@Service
public class AdminService {
    private static final DateTimeFormatter DATE_VN = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final UserRepository users;
    private final AppointmentRepository appts;
    private final TicketRepository tickets;
    private final NotificationService notifs;
    private final AuditService audit;
    private final UserDataCleaner cleaner;
    private final PasswordEncoder encoder;

    public AdminService(UserRepository users, AppointmentRepository appts, TicketRepository tickets,
                        NotificationService notifs, AuditService audit, UserDataCleaner cleaner,
                        PasswordEncoder encoder) {
        this.users = users;
        this.appts = appts;
        this.tickets = tickets;
        this.notifs = notifs;
        this.audit = audit;
        this.cleaner = cleaner;
        this.encoder = encoder;
    }

    // ---------- Khách hàng ----------

    @Transactional(readOnly = true)
    public PageRes<CustomerRow> customers(String q, int page, int size) {
        String key = norm(q);
        List<UserAccount> all = users.findByRole(Role.CUSTOMER).stream()
                .filter(u -> key.isEmpty() || norm(u.getName() + " " + u.getEmail() + " " + nz(u.getPhone())).contains(key))
                .sorted(Comparator.comparing(UserAccount::getCreatedAt).reversed())
                .toList();
        int sz = Math.min(Math.max(size, 1), 100);
        int pg = Math.max(page, 0);
        int from = Math.min(pg * sz, all.size());
        int to = Math.min(from + sz, all.size());
        List<CustomerRow> rows = all.subList(from, to).stream()
                .map(u -> new CustomerRow(u.getId(), u.getName(), u.getEmail(), mask(u.getPhone()), !u.isEnabled(),
                        u.getCreatedAt().toEpochMilli(), appts.countByUserId(u.getId())))
                .toList();
        return new PageRes<>(rows, all.size(), pg, sz);
    }

    /** Xem đủ thông tin một khách (có số điện thoại đầy đủ): được ghi nhật ký. */
    @Transactional
    public CustomerDetail customer(UserAccount admin, Long id) {
        UserAccount u = customerOf(id);
        audit.log(admin.getEmail(), "XEM_KHACH", "KH#" + id, "Xem hồ sơ đầy đủ");
        List<Appointment> list = appts.findByUserIdOrderByDateDescStartMinDesc(id);
        return new CustomerDetail(u.getId(), u.getName(), u.getEmail(), nz(u.getPhone()), nz(u.getDob()),
                nz(u.getGender()), !u.isEnabled(), u.isRemind(), u.isPromo(), u.getCreatedAt().toEpochMilli(),
                list.stream().map(AppointmentService::toDto).toList());
    }

    @Transactional
    public void editCustomer(UserAccount admin, Long id, CustomerEditReq r) {
        UserAccount u = customerOf(id);
        List<String> changed = new ArrayList<>();
        if (!r.name().trim().equals(u.getName())) {
            u.setName(r.name().trim());
            changed.add("tên");
        }
        if (!blank(r.phone()).equals(nz(u.getPhone()))) {
            u.setPhone(blank(r.phone()).isEmpty() ? null : r.phone().trim());
            changed.add("số điện thoại");
        }
        if (!blank(r.dob()).equals(nz(u.getDob()))) {
            u.setDob(blank(r.dob()).isEmpty() ? null : r.dob());
            changed.add("ngày sinh");
        }
        if (!blank(r.gender()).equals(nz(u.getGender()))) {
            u.setGender(blank(r.gender()).isEmpty() ? null : r.gender());
            changed.add("giới tính");
        }
        users.save(u);
        audit.log(admin.getEmail(), "SUA_KHACH", "KH#" + id,
                changed.isEmpty() ? "Không thay đổi" : "Đã sửa: " + String.join(", ", changed));
    }

    /** Khóa tài khoản: khách không đăng nhập được nữa và token đang dùng bị vô hiệu ngay. */
    @Transactional
    public void lock(UserAccount admin, Long id, boolean locked) {
        UserAccount u = customerOf(id);
        u.setEnabled(!locked);
        if (locked) {
            u.setTokenVersion(u.getTokenVersion() + 1);
        }
        users.save(u);
        audit.log(admin.getEmail(), locked ? "KHOA_KHACH" : "MO_KHOA_KHACH", "KH#" + id, null);
    }

    /** Xóa khách và toàn bộ dữ liệu của khách. Phải nhập lại mật khẩu quản trị. Nhật ký chỉ ghi mã khách, không ghi tên hay email. */
    @Transactional
    public void deleteCustomer(UserAccount admin, Long id, String adminPassword) {
        if (!encoder.matches(adminPassword, admin.getPasswordHash())) {
            throw ApiException.bad("Mật khẩu quản trị chưa đúng.");
        }
        UserAccount u = customerOf(id);
        cleaner.deleteAll(id);
        users.delete(u);
        audit.log(admin.getEmail(), "XOA_KHACH", "KH#" + id, "Xóa tài khoản và toàn bộ dữ liệu liên quan");
    }

    // ---------- Lịch hẹn ----------

    @Transactional(readOnly = true)
    public List<AdminApptDto> appointments(String status, String date, String q) {
        List<Appointment> list = appts.findTop500ByOrderByDateDescStartMinDesc();
        Set<Long> ids = list.stream().map(Appointment::getUserId).collect(Collectors.toSet());
        Map<Long, UserAccount> byId = new HashMap<>();
        users.findAllById(ids).forEach(u -> byId.put(u.getId(), u));
        String key = norm(q);
        LocalDateTime now = LocalDateTime.now(AppointmentService.ZONE);
        List<AdminApptDto> out = new ArrayList<>();
        for (Appointment a : list) {
            String st = effStatus(a, now);
            if (status != null && !status.isBlank() && !status.equalsIgnoreCase("all") && !status.equalsIgnoreCase(st)) {
                continue;
            }
            if (date != null && !date.isBlank() && !a.getDate().toString().equals(date)) {
                continue;
            }
            UserAccount u = byId.get(a.getUserId());
            String name = u == null ? "(đã xóa)" : u.getName();
            if (!key.isEmpty() && !norm(a.getId() + " " + name + " " + a.getServiceName()).contains(key)) {
                continue;
            }
            out.add(new AdminApptDto(a.getId(), a.getServiceKey(), a.getServiceName(), a.getStaffId(),
                    a.getDate().toString(), time(a.getStartMin()), a.getDurationMin(), st, a.getTotal(), a.getCode(),
                    a.getNote(), a.getCancelReason(), a.getUserId(), name, u == null ? "" : mask(u.getPhone())));
        }
        return out;
    }

    /** Phòng khám hủy lịch: bắt buộc có lý do, khách nhận thông báo kèm lý do. */
    @Transactional
    public void cancelAppointment(UserAccount admin, String id, String reason) {
        Appointment a = appts.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy lịch hẹn."));
        if (!effStatus(a, LocalDateTime.now(AppointmentService.ZONE)).equals("upcoming")) {
            throw ApiException.bad("Chỉ hủy được lịch đang ở trạng thái sắp tới.");
        }
        a.setStatus(ApptStatus.CANCELLED);
        a.setCancelReason(reason.trim());
        appts.save(a);
        notifs.push(a.getUserId(), "booking", "Phòng khám đã hủy lịch hẹn",
                a.getServiceName() + ", mã " + a.getId() + ", lúc " + time(a.getStartMin()) + " ngày "
                        + a.getDate().format(DATE_VN) + ". Lý do: " + reason.trim());
        audit.log(admin.getEmail(), "HUY_LICH", a.getId(), "Lý do: " + reason.trim());
    }

    @Transactional
    public void completeAppointment(UserAccount admin, String id) {
        Appointment a = appts.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy lịch hẹn."));
        if (a.getStatus() != ApptStatus.UPCOMING) {
            throw ApiException.bad("Chỉ hoàn thành được lịch đang ở trạng thái sắp tới.");
        }
                      a.setStatus(ApptStatus.DONE);
        appts.save(a);
        notifs.push(a.getUserId(), "booking", "Lịch hẹn đã hoàn thành",
                a.getServiceName() + ", mã " + a.getId() + ", ngày " + a.getDate().format(DATE_VN)
                        + ". Cảm ơn bạn đã đến khám. Vào Lịch hẹn, mục Đã khám để đánh giá dịch vụ.");
        audit.log(admin.getEmail(), "HOAN_THANH_LICH", a.getId(), null);
    }

    // ---------- Thống kê ----------

    @Transactional(readOnly = true)
    public StatsRes stats() {
        LocalDateTime now = LocalDateTime.now(AppointmentService.ZONE);
        long up = 0;
        long done = 0;
        long cancelled = 0;
        for (Appointment a : appts.findAll()) {
            switch (effStatus(a, now)) {
                case "upcoming" -> up++;
                case "done" -> done++;
                default -> cancelled++;
            }
        }
        LocalDate today = now.toLocalDate();
        List<DayCount> week = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            week.add(new DayCount(d.toString(), appts.countByDateAndStatusNot(d, ApptStatus.CANCELLED)));
        }
        return new StatsRes(users.countByRole(Role.CUSTOMER), up, done, cancelled,
                appts.countByDateAndStatusNot(today, ApptStatus.CANCELLED), appts.sumTotalExcluding(ApptStatus.CANCELLED),
                tickets.countByStatus(TicketStatus.OPEN), week);
    }

    // ---------- Hàm dùng chung ----------

    private UserAccount customerOf(Long id) {
        UserAccount u = users.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy khách hàng."));
        if (u.getRole() != Role.CUSTOMER) {
            throw ApiException.forbidden("Đây là tài khoản quản trị, không thao tác ở mục khách hàng.");
        }
        return u;
    }

    private static String effStatus(Appointment a, LocalDateTime now) {
        if (a.getStatus() == ApptStatus.UPCOMING
                && a.getDate().atStartOfDay().plusMinutes(a.getStartMin() + a.getDurationMin()).isBefore(now)) {
            return "done";
        }
        return a.getStatus().name().toLowerCase(Locale.ROOT);
    }

    /** Che số điện thoại: giữ 2 số đầu và 3 số cuối. */
    static String mask(String phone) {
        if (phone == null || phone.isBlank()) {
            return "";
        }
        String p = phone.replace(" ", "");
        if (p.length() < 7) {
            return "***";
        }
        return p.substring(0, 2) + "*".repeat(p.length() - 5) + p.substring(p.length() - 3);
    }

    private static String time(int m) {
        return String.format("%02d:%02d", m / 60, m % 60);
    }

    private static String nz(String s) {
        return s == null ? "" : s;
    }

    private static String blank(String s) {
        return s == null ? "" : s.trim();
    }

    private static String norm(String s) {
        return s == null ? "" : s.trim().toLowerCase(Locale.ROOT);
    }
}
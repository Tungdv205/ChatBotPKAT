package vn.anhthu.hengio.service;

import java.security.SecureRandom;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import vn.anhthu.hengio.config.ApiException;
import vn.anhthu.hengio.model.Appointment;
import vn.anhthu.hengio.model.ApptStatus;
import vn.anhthu.hengio.model.Category;
import vn.anhthu.hengio.model.ServiceItem;
import vn.anhthu.hengio.model.Staff;
import vn.anhthu.hengio.model.Voucher;
import vn.anhthu.hengio.repo.AppointmentRepository;
import vn.anhthu.hengio.repo.CategoryRepository;
import vn.anhthu.hengio.repo.ServiceRepository;
import vn.anhthu.hengio.repo.StaffRepository;
import vn.anhthu.hengio.repo.VoucherRepository;
import vn.anhthu.hengio.web.dto.AppointmentDtos.ApptDto;
import vn.anhthu.hengio.web.dto.AppointmentDtos.CreateReq;
import vn.anhthu.hengio.web.dto.AppointmentDtos.RatingReq;
import vn.anhthu.hengio.web.dto.AppointmentDtos.RescheduleReq;
import vn.anhthu.hengio.web.dto.AppointmentDtos.SlotDto;
import vn.anhthu.hengio.web.dto.AppointmentDtos.SlotsRes;
import vn.anhthu.hengio.web.dto.AppointmentDtos.VoucherRes;

/**
 * Toàn bộ luật đặt lịch chạy ở server (giao diện chỉ hiển thị): giờ làm việc, nghỉ trưa, trùng giờ,
 * bác sĩ rảnh, mã ưu đãi, hạn đổi/hủy. Server tự tính giá, không tin số tiền do giao diện gửi lên.
 */
@Service
public class AppointmentService {
        public static final String WELCOME_CODE = "CHAOMUNG";
    static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    static final int OPEN = 480;          // 08:00
    static final int CLOSE = 1080;        // 18:00
    static final int LUNCH_START = 720;   // 12:00
    static final int LUNCH_END = 810;     // 13:30
    static final int STEP = 30;
    static final int MAX_TOTAL_MIN = 270;
    static final int MAX_SERVICES = 5;
    static final int MAX_DAYS_AHEAD = 90;
    static final int MIN_LEAD_MIN = 60;   // đặt trước ít nhất 1 giờ
    static final int CHANGE_LEAD_HOURS = 2; // đổi/hủy trước giờ hẹn ít nhất 2 giờ

    /** Một hoặc nhiều dịch vụ gộp lại thành một lần khám. */
    record Combo(String key, String name, List<String> cats, int dur, long price) {}

    private final AppointmentRepository appts;
    private final ServiceRepository services;
    private final StaffRepository staff;
    private final VoucherRepository vouchers;
    private final CategoryRepository categories;
        private final NotificationService notifs;
    private final TransactionTemplate tx;
    private final SecureRandom random = new SecureRandom();
    private final Object lock = new Object(); // tuần tự hóa việc tạo/đổi lịch để không bị đặt trùng cùng lúc

     public AppointmentService(AppointmentRepository appts, ServiceRepository services, StaffRepository staff,
                              VoucherRepository vouchers, CategoryRepository categories,
                              NotificationService notifs, PlatformTransactionManager txManager) {
        this.appts = appts;
        this.services = services;
        this.staff = staff;
        this.vouchers = vouchers;
        this.categories = categories;
        this.notifs = notifs;
        this.tx = new TransactionTemplate(txManager);
    }

    // ---------- Đọc ----------

    @Transactional
    public List<ApptDto> list(Long userId) {
        List<Appointment> list = appts.findByUserIdOrderByDateDescStartMinDesc(userId);
        markDone(list);
        return list.stream().map(AppointmentService::toDto).toList();
    }

    @Transactional(readOnly = true)
    public SlotsRes slots(Long userId, String svcKey, String staffSel, String dateStr, String exceptId) {
        Combo c = combo(svcKey);
        LocalDate date = parseDate(dateStr);
        List<String> pool = pool(c, staffSel);
        LocalDateTime now = LocalDateTime.now(ZONE);
        List<SlotDto> out = new ArrayList<>();
        for (int m = OPEN; m < CLOSE; m += STEP) {
            if (!fitsHours(m, c.dur())) {
                continue;
            }
            final int start = m;
            String state = baseState(date, start, now);
            if (state.equals("ok")) {
                if (userBusy(userId, date, start, c.dur(), exceptId)) {
                    state = "mine";
                } else if (pool.stream().allMatch(id -> staffBusy(id, date, start, c.dur(), exceptId))) {
                    state = "busy";
                }
            }
            out.add(new SlotDto(fmtTime(start), state));
        }
        return new SlotsRes(date.toString(), out);
    }

    @Transactional(readOnly = true)
    public VoucherRes checkVoucher(Long userId, String svcKey, String code) {
        Combo c = combo(svcKey);
        Voucher v = voucherFor(c, code);
        requireFirstUse(userId, v);
        long d = discount(c, v);
        return new VoucherRes(v.getCode(), v.getTitle(), d, c.price() - d);
    }

    // ---------- Ghi ----------

    public ApptDto create(Long userId, CreateReq r) {
        synchronized (lock) {
            return tx.execute(st -> doCreate(userId, r));
        }
    }

    public ApptDto reschedule(Long userId, String id, RescheduleReq r) {
        synchronized (lock) {
            return tx.execute(st -> doReschedule(userId, id, r));
        }
    }

    @Transactional
    public ApptDto cancel(Long userId, String id, String reason) {
        Appointment a = own(userId, id);
        requireUpcoming(a);
        requireLead(a, "Chỉ hủy được lịch trước giờ hẹn ít nhất " + CHANGE_LEAD_HOURS + " giờ. Vui lòng gọi phòng khám.");
        a.setStatus(ApptStatus.CANCELLED);
                a.setCancelReason(reason == null || reason.isBlank() ? null : reason.trim());
        appts.save(a);
        tell(a, "Đã hủy lịch hẹn");
        return toDto(a);
    }

    @Transactional
    public ApptDto rate(Long userId, String id, RatingReq r) {
        Appointment a = own(userId, id);
        markDone(List.of(a));
        if (a.getStatus() != ApptStatus.DONE) {
            throw ApiException.bad("Chỉ đánh giá được sau khi đã khám xong.");
        }
        if (a.getRating() != null) {
            throw ApiException.conflict("Bạn đã đánh giá lịch hẹn này rồi.");
        }
        a.setRating(r.stars());
        a.setRatingComment(r.comment() == null || r.comment().isBlank() ? null : r.comment().trim());
        return toDto(appts.save(a));
    }

    // ---------- Xử lý chi tiết ----------

    private ApptDto doCreate(Long userId, CreateReq r) {
        Combo c = combo(r.svc());
        LocalDate date = parseDate(r.date());
        int m = parseTime(r.time());
        requireSlot(c.dur(), date, m);
        if (userBusy(userId, date, m, c.dur(), null)) {
            throw ApiException.conflict("Bạn đã có lịch khác trùng giờ này.");
        }
        String staffId = chooseStaff(pool(c, r.staff()), r.staff(), date, m, c.dur(), null);
        long d = 0;
        String code = null;
        if (r.code() != null && !r.code().isBlank()) {
            Voucher v = voucherFor(c, r.code());
                        requireFirstUse(userId, v);
            d = discount(c, v);
            code = v.getCode();
        }
        Appointment a = new Appointment();
        a.setId(newId());
        a.setUserId(userId);
        a.setServiceKey(c.key());
        a.setServiceName(c.name());
        a.setStaffId(staffId);
        a.setDate(date);
        a.setStartMin(m);
        a.setDurationMin(c.dur());
        a.setDiscount(d);
        a.setCode(code);
        a.setTotal(c.price() - d);
                a.setNote(r.note() == null || r.note().isBlank() ? null : r.note().trim());
        appts.save(a);
        tell(a, "Đặt lịch thành công");
        return toDto(a);
    }

    private ApptDto doReschedule(Long userId, String id, RescheduleReq r) {
        Appointment a = own(userId, id);
        requireUpcoming(a);
        requireLead(a, "Chỉ đổi lịch được trước giờ hẹn ít nhất " + CHANGE_LEAD_HOURS + " giờ. Vui lòng gọi phòng khám.");
        Combo base = combo(a.getServiceKey());
        Combo c = new Combo(base.key(), base.name(), base.cats(), a.getDurationMin(), base.price());
        LocalDate date = parseDate(r.date());
        int m = parseTime(r.time());
        requireSlot(c.dur(), date, m);
        if (userBusy(userId, date, m, c.dur(), a.getId())) {
            throw ApiException.conflict("Bạn đã có lịch khác trùng giờ này.");
        }
        a.setStaffId(chooseStaff(pool(c, r.staff()), r.staff(), date, m, c.dur(), a.getId()));
                a.setDate(date);
        a.setStartMin(m);
        appts.save(a);
        tell(a, "Đã đổi lịch hẹn");
        return toDto(a);
    }

    /** Ghép các mã dịch vụ (s1+s12) thành một lần khám: cộng giá, cộng thời lượng, gộp chuyên khoa. */
    private Combo combo(String key) {
        List<String> ids = Arrays.stream(key == null ? new String[0] : key.split("\\+"))
                .map(String::trim).filter(s -> !s.isEmpty()).distinct().toList();
        if (ids.isEmpty() || ids.size() > MAX_SERVICES) {
            throw ApiException.bad("Vui lòng chọn từ 1 đến " + MAX_SERVICES + " dịch vụ.");
        }
        int dur = 0;
        long price = 0;
        List<String> names = new ArrayList<>();
        Set<String> cats = new LinkedHashSet<>();
        for (String id : ids) {
            ServiceItem s = services.findById(id).filter(ServiceItem::isActive)
                    .orElseThrow(() -> ApiException.bad("Dịch vụ không tồn tại hoặc đã ngừng cung cấp."));
            dur += s.getDurationMin();
            price += s.getPrice();
            names.add(s.getName());
            cats.add(s.getCategoryId());
        }
        if (dur > MAX_TOTAL_MIN) {
            throw ApiException.bad("Tổng thời gian các dịch vụ tối đa " + MAX_TOTAL_MIN + " phút. Vui lòng bớt dịch vụ hoặc đặt thành hai lịch.");
        }
        return new Combo(String.join("+", ids), String.join(" + ", names), List.copyOf(cats), dur, price);
    }

    /** Danh sách bác sĩ có thể nhận lượt khám: bác sĩ phụ trách đủ các chuyên khoa, nếu không có thì phụ trách ít nhất một. */
    private List<String> pool(Combo c, String sel) {
        List<Staff> active = staff.findByActiveTrueOrderById();
        List<Staff> all = active.stream().filter(s -> staffCats(s).containsAll(c.cats())).toList();
        if (all.isEmpty()) {
            all = active.stream().filter(s -> c.cats().stream().anyMatch(staffCats(s)::contains)).toList();
        }
        List<String> ids = all.stream().map(Staff::getId).toList();
        if (sel == null || sel.equals("any")) {
            if (ids.isEmpty()) {
                throw ApiException.bad("Hiện chưa có bác sĩ phụ trách dịch vụ này.");
            }
            return ids;
        }
        if (!ids.contains(sel)) {
            throw ApiException.bad("Bác sĩ này không phụ trách dịch vụ đã chọn.");
        }
        return List.of(sel);
    }

    private static Set<String> staffCats(Staff s) {
        String t = s.getCategories();
        return t == null || t.isBlank() ? Set.of() : Set.copyOf(Arrays.asList(t.split(",")));
    }

    private String chooseStaff(List<String> pool, String sel, LocalDate date, int m, int dur, String exceptId) {
        for (String id : pool) {
            if (!staffBusy(id, date, m, dur, exceptId)) {
                return id;
            }
        }
        throw ApiException.conflict(pool.size() > 1 || "any".equals(sel)
                ? "Khung giờ này đã kín bác sĩ. Vui lòng chọn giờ khác."
                : "Bác sĩ đã có lịch ở giờ này. Vui lòng chọn giờ hoặc bác sĩ khác.");
    }

    private boolean staffBusy(String staffId, LocalDate date, int start, int dur, String exceptId) {
        return appts.findByStaffIdAndDateAndStatusNot(staffId, date, ApptStatus.CANCELLED).stream()
                .anyMatch(a -> !a.getId().equals(exceptId) && overlap(start, dur, a.getStartMin(), a.getDurationMin()));
    }

    private boolean userBusy(Long userId, LocalDate date, int start, int dur, String exceptId) {
        return appts.findByUserIdAndDateAndStatusNot(userId, date, ApptStatus.CANCELLED).stream()
                .anyMatch(a -> !a.getId().equals(exceptId) && overlap(start, dur, a.getStartMin(), a.getDurationMin()));
    }

    private static boolean overlap(int s1, int d1, int s2, int d2) {
        return s1 < s2 + d2 && s2 < s1 + d1;
    }

    /** Giờ bắt đầu hợp lệ: nằm trong giờ làm việc, kết thúc trước 18:00, không vướng nghỉ trưa 12:00-13:30. */
    private static boolean fitsHours(int m, int dur) {
        if (m < OPEN || m % STEP != 0 || m + dur > CLOSE) {
            return false;
        }
        return !(m < LUNCH_END && m + dur > LUNCH_START);
    }

    private static String baseState(LocalDate date, int m, LocalDateTime now) {
        LocalDate today = now.toLocalDate();
        if (date.getDayOfWeek() == DayOfWeek.SUNDAY || date.isAfter(today.plusDays(MAX_DAYS_AHEAD))) {
            return "closed";
        }
        if (date.isBefore(today)) {
            return "past";
        }
        if (date.equals(today) && m < now.getHour() * 60 + now.getMinute() + MIN_LEAD_MIN) {
            return "past";
        }
        return "ok";
    }

    private static void requireSlot(int dur, LocalDate date, int m) {
        if (!fitsHours(m, dur)) {
            throw ApiException.bad("Khung giờ này nằm ngoài giờ làm việc hoặc trùng giờ nghỉ trưa (12:00 - 13:30).");
        }
        switch (baseState(date, m, LocalDateTime.now(ZONE))) {
            case "closed" -> throw ApiException.bad("Phòng khám nghỉ Chủ nhật, và chỉ nhận đặt lịch trong " + MAX_DAYS_AHEAD + " ngày tới.");
            case "past" -> throw ApiException.bad("Khung giờ này đã qua hoặc quá gần. Vui lòng đặt trước ít nhất " + (MIN_LEAD_MIN / 60) + " giờ.");
            default -> { }
        }
    }
        private void requireFirstUse(Long userId, Voucher v) {
        if (WELCOME_CODE.equals(v.getCode()) && appts.existsByUserIdAndStatusNot(userId, ApptStatus.CANCELLED)) {
            throw ApiException.bad("Mã chào mừng chỉ dùng cho lần đặt lịch đầu tiên.");
        }
    }

    private Voucher voucherFor(Combo c, String code) {
        Voucher v = vouchers.findById(code.trim().toUpperCase(Locale.ROOT)).filter(Voucher::isActive)
                .orElseThrow(() -> ApiException.bad("Mã không tồn tại hoặc đã hết hạn."));
        String cat = v.getCategoryId();
        if (cat != null && !cat.isBlank() && !c.cats().contains(cat)) {
            String n = categories.findById(cat).map(Category::getName).orElse("chuyên khoa khác");
            throw ApiException.bad("Mã này chỉ áp dụng cho " + n + ".");
        }
        if (c.price() < v.getMinOrder()) {
            throw ApiException.bad("Mã này áp dụng cho đơn từ " + String.format(Locale.GERMANY, "%,d", v.getMinOrder()) + "đ.");
        }
        return v;
    }

    private static long discount(Combo c, Voucher v) {
        long d = "pct".equals(v.getDiscountType())
                ? Math.round(c.price() * v.getDiscountValue() / 100.0)
                : v.getDiscountValue();
        if ("pct".equals(v.getDiscountType()) && v.getMaxDiscount() > 0) {
            d = Math.min(d, v.getMaxDiscount());
        }
        return Math.min(d, c.price());
    }

    private Appointment own(Long userId, String id) {
        return appts.findById(id).filter(a -> a.getUserId().equals(userId))
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy lịch hẹn."));
    }

    private static void requireUpcoming(Appointment a) {
        if (a.getStatus() != ApptStatus.UPCOMING) {
            throw ApiException.bad("Lịch hẹn này không còn ở trạng thái sắp tới.");
        }
    }

    private static void requireLead(Appointment a, String msg) {
        LocalDateTime start = a.getDate().atStartOfDay().plusMinutes(a.getStartMin());
        if (Duration.between(LocalDateTime.now(ZONE), start).toMinutes() < CHANGE_LEAD_HOURS * 60L) {
            throw ApiException.bad(msg);
        }
    }

    /** Lịch sắp tới đã qua giờ kết thúc thì chuyển sang "đã khám". */
    private static void markDone(List<Appointment> list) {
        LocalDateTime now = LocalDateTime.now(ZONE);
        for (Appointment a : list) {
            LocalDateTime end = a.getDate().atStartOfDay().plusMinutes(a.getStartMin() + a.getDurationMin());
            if (a.getStatus() == ApptStatus.UPCOMING && end.isBefore(now)) {
                a.setStatus(ApptStatus.DONE);
            }
        }
    }

       /** Gửi thông báo cho khách về lịch hẹn vừa thay đổi. */
    private void tell(Appointment a, String title) {
        notifs.push(a.getUserId(), "booking", title, a.getServiceName() + ", mã " + a.getId() + ", lúc "
                + fmtTime(a.getStartMin()) + " ngày " + a.getDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ".");
    }

    private String newId() {
        String id;
        do {
            id = "HG-" + (1000 + random.nextInt(9000));
        } while (appts.existsById(id));
        return id;
    }

    private static LocalDate parseDate(String s) {
        try {
            return LocalDate.parse(s);
        } catch (Exception e) {
            throw ApiException.bad("Ngày không hợp lệ (định dạng yyyy-MM-dd).");
        }
    }

    private static int parseTime(String s) {
        try {
            String[] p = s.split(":");
            int h = Integer.parseInt(p[0]);
            int mi = Integer.parseInt(p[1]);
            if (h < 0 || h > 23 || mi < 0 || mi > 59) {
                throw new IllegalArgumentException();
            }
            return h * 60 + mi;
        } catch (Exception e) {
            throw ApiException.bad("Giờ không hợp lệ (định dạng HH:mm).");
        }
    }

    private static String fmtTime(int m) {
        return String.format("%02d:%02d", m / 60, m % 60);
    }

    static ApptDto toDto(Appointment a) {
        return new ApptDto(a.getId(), a.getServiceKey(), a.getServiceName(), a.getStaffId(), a.getDate().toString(),
                fmtTime(a.getStartMin()), a.getDurationMin(), a.getStatus().name().toLowerCase(Locale.ROOT),
                a.getDiscount(), a.getCode(), a.getTotal(), a.getNote(), a.getRating(), a.getRatingComment(),
                a.getCancelReason());
    }
}
package vn.anhthu.hengio.service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.anhthu.hengio.config.ApiException;
import vn.anhthu.hengio.model.ApptStatus;
import vn.anhthu.hengio.model.ServiceItem;
import vn.anhthu.hengio.model.Staff;
import vn.anhthu.hengio.model.UserAccount;
import vn.anhthu.hengio.model.Voucher;
import vn.anhthu.hengio.repo.AppointmentRepository;
import vn.anhthu.hengio.repo.CategoryRepository;
import vn.anhthu.hengio.repo.ServiceRepository;
import vn.anhthu.hengio.repo.StaffRepository;
import vn.anhthu.hengio.repo.VoucherRepository;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.ServiceAdmin;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.ServiceReq;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.StaffAdmin;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.StaffReq;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.VoucherAdmin;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.VoucherReq;

/**
 * Quản lý danh mục: dịch vụ, mã ưu đãi, nhân sự. Dịch vụ và nhân sự đã có lịch hẹn tham chiếu nên "xóa" chỉ là ẩn
 * (active = false), không xóa hẳn, để lịch cũ vẫn đúng. Mã ưu đãi có thể xóa hẳn vì lịch chỉ lưu chữ mã.
 */
@Service
public class AdminCatalogService {
    private final ServiceRepository services;
    private final StaffRepository staff;
    private final VoucherRepository vouchers;
    private final CategoryRepository categories;
    private final AppointmentRepository appts;
    private final AuditService audit;

    public AdminCatalogService(ServiceRepository services, StaffRepository staff, VoucherRepository vouchers,
                               CategoryRepository categories, AppointmentRepository appts, AuditService audit) {
        this.services = services;
        this.staff = staff;
        this.vouchers = vouchers;
        this.categories = categories;
        this.appts = appts;
        this.audit = audit;
    }

    // ---------- Dịch vụ ----------

    @Transactional(readOnly = true)
    public List<ServiceAdmin> services() {
        return services.findAll().stream().sorted((a, b) -> numOf(a.getId()) - numOf(b.getId()))
                .map(AdminCatalogService::toAdmin).toList();
    }

    @Transactional
    public ServiceAdmin createService(UserAccount admin, ServiceReq r) {
        checkCategory(r.cat());
        ServiceItem s = new ServiceItem();
        s.setId("s" + (services.findAll().stream().mapToInt(x -> numOf(x.getId())).max().orElse(0) + 1));
        fill(s, r);
        services.save(s);
        audit.log(admin.getEmail(), "THEM_DICH_VU", s.getId(), "Thêm: " + s.getName());
        return toAdmin(s);
    }

    @Transactional
    public ServiceAdmin updateService(UserAccount admin, String id, ServiceReq r) {
        ServiceItem s = services.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy dịch vụ."));
        checkCategory(r.cat());
        fill(s, r);
        services.save(s);
        audit.log(admin.getEmail(), "SUA_DICH_VU", id, "Sửa: " + s.getName());
        return toAdmin(s);
    }

    /** Ẩn dịch vụ khỏi danh mục đặt lịch (lịch cũ không bị ảnh hưởng). */
    @Transactional
    public void hideService(UserAccount admin, String id) {
        ServiceItem s = services.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy dịch vụ."));
        s.setActive(false);
        services.save(s);
        audit.log(admin.getEmail(), "AN_DICH_VU", id, null);
    }

    private void fill(ServiceItem s, ServiceReq r) {
        s.setName(r.name().trim());
        s.setCategoryId(r.cat());
        s.setDurationMin(r.dur());
        s.setPrice(r.price());
        s.setHot(r.hot());
        s.setDescription(r.desc() == null ? "" : r.desc().trim());
        List<String> inc = r.inc() == null ? List.of() : r.inc().stream().map(String::trim).filter(x -> !x.isEmpty()).toList();
        s.setIncludesText(String.join("\n", inc));
        s.setActive(r.active() == null || r.active());
    }

    private static ServiceAdmin toAdmin(ServiceItem s) {
        List<String> inc = s.getIncludesText() == null || s.getIncludesText().isBlank()
                ? List.of() : Arrays.asList(s.getIncludesText().split("\n"));
        return new ServiceAdmin(s.getId(), s.getCategoryId(), s.getName(), s.getDurationMin(), s.getPrice(), s.isHot(),
                s.getDescription(), inc, s.isActive());
    }

    // ---------- Mã ưu đãi ----------

    @Transactional(readOnly = true)
    public List<VoucherAdmin> vouchers() {
        return vouchers.findAll().stream().sorted((a, b) -> a.getCode().compareTo(b.getCode()))
                .map(AdminCatalogService::toAdmin).toList();
    }

    @Transactional
    public VoucherAdmin createVoucher(UserAccount admin, VoucherReq r) {
        if (r.code() == null || r.code().isBlank()) {
            throw ApiException.bad("Hãy nhập mã ưu đãi.");
        }
        String code = r.code().trim().toUpperCase(Locale.ROOT);
        if (vouchers.existsById(code)) {
            throw ApiException.conflict("Mã này đã tồn tại.");
        }
        Voucher v = new Voucher();
        v.setCode(code);
        fill(v, r);
        vouchers.save(v);
        audit.log(admin.getEmail(), "THEM_MA_UU_DAI", code, null);
        return toAdmin(v);
    }

    @Transactional
    public VoucherAdmin updateVoucher(UserAccount admin, String code, VoucherReq r) {
        Voucher v = vouchers.findById(code.toUpperCase(Locale.ROOT))
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy mã ưu đãi."));
        fill(v, r);
        vouchers.save(v);
        audit.log(admin.getEmail(), "SUA_MA_UU_DAI", v.getCode(), null);
        return toAdmin(v);
    }

    @Transactional
    public void deleteVoucher(UserAccount admin, String code) {
        Voucher v = vouchers.findById(code.toUpperCase(Locale.ROOT))
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy mã ưu đãi."));
        vouchers.delete(v);
        audit.log(admin.getEmail(), "XOA_MA_UU_DAI", v.getCode(), null);
    }

    private void fill(Voucher v, VoucherReq r) {
        if ("pct".equals(r.type()) && r.val() > 100) {
            throw ApiException.bad("Giảm theo phần trăm tối đa 100.");
        }
        String cat = r.cat() == null || r.cat().isBlank() ? null : r.cat();
        if (cat != null) {
            checkCategory(cat);
        }
        v.setTitle(r.title().trim());
        v.setDiscountType(r.type());
        v.setDiscountValue(r.val());
        v.setMaxDiscount(r.max());
        v.setMinOrder(r.min());
        v.setCategoryId(cat);
        v.setNote(r.note() == null ? "" : r.note().trim());
        v.setActive(r.active() == null || r.active());
    }

    private static VoucherAdmin toAdmin(Voucher v) {
        return new VoucherAdmin(v.getCode(), v.getTitle(), v.getDiscountType(), v.getDiscountValue(), v.getMaxDiscount(),
                v.getMinOrder(), v.getCategoryId(), v.getNote(), v.isActive());
    }

    // ---------- Nhân sự ----------

    @Transactional(readOnly = true)
    public List<StaffAdmin> staff() {
        return staff.findAll().stream().sorted((a, b) -> numOf(a.getId()) - numOf(b.getId()))
                .map(AdminCatalogService::toAdmin).toList();
    }

    @Transactional
    public StaffAdmin createStaff(UserAccount admin, StaffReq r) {
        Staff s = new Staff();
        s.setId("st" + (staff.findAll().stream().mapToInt(x -> numOf(x.getId())).max().orElse(0) + 1));
        fill(s, r);
        staff.save(s);
        audit.log(admin.getEmail(), "THEM_NHAN_SU", s.getId(), "Thêm: " + s.getName());
        return toAdmin(s);
    }

    @Transactional
    public StaffAdmin updateStaff(UserAccount admin, String id, StaffReq r) {
        Staff s = staff.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy nhân sự."));
        boolean hide = r.active() != null && !r.active();
        if (hide && s.isActive()) {
            requireNoUpcoming(id);
        }
        fill(s, r);
        staff.save(s);
        audit.log(admin.getEmail(), "SUA_NHAN_SU", id, "Sửa: " + s.getName());
        return toAdmin(s);
    }

    /** Ẩn nhân sự khỏi danh sách đặt lịch. Không ẩn được khi còn lịch sắp tới của người này. */
    @Transactional
    public void hideStaff(UserAccount admin, String id) {
        Staff s = staff.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy nhân sự."));
        requireNoUpcoming(id);
        s.setActive(false);
        staff.save(s);
        audit.log(admin.getEmail(), "AN_NHAN_SU", id, null);
    }

    private void requireNoUpcoming(String staffId) {
        LocalDate today = LocalDate.now(AppointmentService.ZONE);
        if (appts.existsByStaffIdAndStatusAndDateGreaterThanEqual(staffId, ApptStatus.UPCOMING, today)) {
            throw ApiException.conflict("Nhân sự này còn lịch hẹn sắp tới. Hãy hủy hoặc đổi các lịch đó trước khi ẩn.");
        }
    }

    private void fill(Staff s, StaffReq r) {
        r.cats().forEach(this::checkCategory);
        s.setName(r.name().trim());
        s.setRoleTitle(r.role() == null ? "" : r.role().trim());
        s.setCategories(String.join(",", r.cats()));
        s.setRating(r.rating());
        s.setExperienceYears(r.years());
        s.setActive(r.active() == null || r.active());
    }

    private static StaffAdmin toAdmin(Staff s) {
        List<String> cats = s.getCategories() == null || s.getCategories().isBlank()
                ? List.of() : Arrays.asList(s.getCategories().split(","));
        return new StaffAdmin(s.getId(), s.getName(), s.getRoleTitle(), cats, s.getRating(), s.getExperienceYears(),
                s.isActive());
    }

    // ---------- Dùng chung ----------

    private void checkCategory(String id) {
        if (id == null || !categories.existsById(id)) {
            throw ApiException.bad("Chuyên khoa không tồn tại.");
        }
    }

    private static int numOf(String id) {
        try {
            return Integer.parseInt(id.replaceAll("\\D", ""));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
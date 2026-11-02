package vn.anhthu.hengio.web;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.anhthu.hengio.model.UserAccount;
import vn.anhthu.hengio.service.AdminCatalogService;
import vn.anhthu.hengio.service.AdminTicketService;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.ReplyReq;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.ServiceAdmin;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.ServiceReq;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.StaffAdmin;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.StaffReq;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.TicketAdmin;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.VoucherAdmin;
import vn.anhthu.hengio.web.dto.AdminCatalogDtos.VoucherReq;

/** Quản lý danh mục và yêu cầu hỗ trợ. Chỉ ADMIN vào được (cấu hình ở SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminCatalogController {
    private static final Map<String, String> OK = Map.of("message", "ok");

    private final AdminCatalogService catalog;
    private final AdminTicketService tickets;

    public AdminCatalogController(AdminCatalogService catalog, AdminTicketService tickets) {
        this.catalog = catalog;
        this.tickets = tickets;
    }

    // ----- Dịch vụ -----
    @GetMapping("/services")
    public List<ServiceAdmin> services() {
        return catalog.services();
    }

    @PostMapping("/services")
    @ResponseStatus(HttpStatus.CREATED)
    public ServiceAdmin createService(@AuthenticationPrincipal UserAccount me, @Valid @RequestBody ServiceReq r) {
        return catalog.createService(me, r);
    }

    @PutMapping("/services/{id}")
    public ServiceAdmin updateService(@AuthenticationPrincipal UserAccount me, @PathVariable String id,
                                      @Valid @RequestBody ServiceReq r) {
        return catalog.updateService(me, id, r);
    }

    @DeleteMapping("/services/{id}")
    public Map<String, String> hideService(@AuthenticationPrincipal UserAccount me, @PathVariable String id) {
        catalog.hideService(me, id);
        return OK;
    }

    // ----- Mã ưu đãi -----
    @GetMapping("/vouchers")
    public List<VoucherAdmin> vouchers() {
        return catalog.vouchers();
    }

    @PostMapping("/vouchers")
    @ResponseStatus(HttpStatus.CREATED)
    public VoucherAdmin createVoucher(@AuthenticationPrincipal UserAccount me, @Valid @RequestBody VoucherReq r) {
        return catalog.createVoucher(me, r);
    }

    @PutMapping("/vouchers/{code}")
    public VoucherAdmin updateVoucher(@AuthenticationPrincipal UserAccount me, @PathVariable String code,
                                      @Valid @RequestBody VoucherReq r) {
        return catalog.updateVoucher(me, code, r);
    }

    @DeleteMapping("/vouchers/{code}")
    public Map<String, String> deleteVoucher(@AuthenticationPrincipal UserAccount me, @PathVariable String code) {
        catalog.deleteVoucher(me, code);
        return OK;
    }

    // ----- Nhân sự -----
    @GetMapping("/staff")
    public List<StaffAdmin> staff() {
        return catalog.staff();
    }

    @PostMapping("/staff")
    @ResponseStatus(HttpStatus.CREATED)
    public StaffAdmin createStaff(@AuthenticationPrincipal UserAccount me, @Valid @RequestBody StaffReq r) {
        return catalog.createStaff(me, r);
    }

    @PutMapping("/staff/{id}")
    public StaffAdmin updateStaff(@AuthenticationPrincipal UserAccount me, @PathVariable String id,
                                  @Valid @RequestBody StaffReq r) {
        return catalog.updateStaff(me, id, r);
    }

    @DeleteMapping("/staff/{id}")
    public Map<String, String> hideStaff(@AuthenticationPrincipal UserAccount me, @PathVariable String id) {
        catalog.hideStaff(me, id);
        return OK;
    }

    // ----- Yêu cầu hỗ trợ -----
    @GetMapping("/tickets")
    public List<TicketAdmin> tickets(@RequestParam(defaultValue = "all") String status) {
        return tickets.list(status);
    }

    @PostMapping("/tickets/{id}/reply")
    public Map<String, String> reply(@AuthenticationPrincipal UserAccount me, @PathVariable String id,
                                     @Valid @RequestBody ReplyReq r) {
        tickets.reply(me, id, r.reply());
        return OK;
    }
}
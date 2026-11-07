package vn.anhthu.hengio.web;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.anhthu.hengio.model.UserAccount;
import vn.anhthu.hengio.service.AdminService;
import vn.anhthu.hengio.service.AuditService;
import vn.anhthu.hengio.web.dto.AdminDtos.AdminApptDto;
import vn.anhthu.hengio.web.dto.AdminDtos.AuditDto;
import vn.anhthu.hengio.web.dto.AdminDtos.CancelReasonReq;
import vn.anhthu.hengio.web.dto.AdminDtos.ConfirmReq;
import vn.anhthu.hengio.web.dto.AdminDtos.CustomerDetail;
import vn.anhthu.hengio.web.dto.AdminDtos.CustomerEditReq;
import vn.anhthu.hengio.web.dto.AdminDtos.CustomerRow;
import vn.anhthu.hengio.web.dto.AdminDtos.LockReq;
import vn.anhthu.hengio.web.dto.AdminDtos.PageRes;
import vn.anhthu.hengio.web.dto.AdminDtos.StatsRes;

/** API quản trị. Cấu hình bảo mật chỉ cho tài khoản có vai trò ADMIN vào /api/admin/**. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private static final Map<String, String> OK = Map.of("message", "ok");

    private final AdminService admin;
    private final AuditService audit;

    public AdminController(AdminService admin, AuditService audit) {
        this.admin = admin;
        this.audit = audit;
    }

    @GetMapping("/customers")
    public PageRes<CustomerRow> customers(@RequestParam(required = false) String q,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return admin.customers(q, page, size);
    }

    @GetMapping("/customers/{id}")
    public CustomerDetail customer(@AuthenticationPrincipal UserAccount me, @PathVariable Long id) {
        return admin.customer(me, id);
    }

    @PutMapping("/customers/{id}")
    public Map<String, String> edit(@AuthenticationPrincipal UserAccount me, @PathVariable Long id,
                                    @Valid @RequestBody CustomerEditReq r) {
        admin.editCustomer(me, id, r);
        return OK;
    }

    @PostMapping("/customers/{id}/lock")
    public Map<String, String> lock(@AuthenticationPrincipal UserAccount me, @PathVariable Long id,
                                    @RequestBody LockReq r) {
        admin.lock(me, id, r.locked());
        return OK;
    }

    @DeleteMapping("/customers/{id}")
    public Map<String, String> delete(@AuthenticationPrincipal UserAccount me, @PathVariable Long id,
                                      @Valid @RequestBody ConfirmReq r) {
        admin.deleteCustomer(me, id, r.password());
        return OK;
    }

    @GetMapping("/appointments")
    public List<AdminApptDto> appointments(@RequestParam(required = false) String status,
                                           @RequestParam(required = false) String date,
                                           @RequestParam(required = false) String q) {
        return admin.appointments(status, date, q);
    }

    @PostMapping("/appointments/{id}/cancel")
    public Map<String, String> cancel(@AuthenticationPrincipal UserAccount me, @PathVariable String id,
                                      @Valid @RequestBody CancelReasonReq r) {
        admin.cancelAppointment(me, id, r.reason());
        return OK;
    }

    @PostMapping("/appointments/{id}/done")
    public Map<String, String> done(@AuthenticationPrincipal UserAccount me, @PathVariable String id) {
        admin.completeAppointment(me, id);
        return OK;
    }
    @DeleteMapping("/appointments/{id}")
    public Map<String, String> deleteAppointment(@AuthenticationPrincipal UserAccount me, @PathVariable String id) {
        admin.deleteAppointment(me, id);
        return OK;
    }
    @GetMapping("/stats")
    public StatsRes stats() {
        return admin.stats();
    }

    @GetMapping("/audit")
    public List<AuditDto> audit() {
        return audit.recent();
    }
}
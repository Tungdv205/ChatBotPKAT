package vn.anhthu.hengio.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
import vn.anhthu.hengio.service.AppointmentService;
import vn.anhthu.hengio.web.dto.AppointmentDtos.ApptDto;
import vn.anhthu.hengio.web.dto.AppointmentDtos.CancelReq;
import vn.anhthu.hengio.web.dto.AppointmentDtos.CreateReq;
import vn.anhthu.hengio.web.dto.AppointmentDtos.RatingReq;
import vn.anhthu.hengio.web.dto.AppointmentDtos.RescheduleReq;
import vn.anhthu.hengio.web.dto.AppointmentDtos.SlotsRes;
import vn.anhthu.hengio.web.dto.AppointmentDtos.VoucherReq;
import vn.anhthu.hengio.web.dto.AppointmentDtos.VoucherRes;

/** Đặt lịch của người đang đăng nhập. Mọi API ở đây yêu cầu token; khách chỉ thấy lịch của chính mình. */
@RestController
@RequestMapping("/api")
public class AppointmentController {
    private final AppointmentService svc;

    public AppointmentController(AppointmentService svc) {
        this.svc = svc;
    }

    @GetMapping("/appointments")
    public List<ApptDto> mine(@AuthenticationPrincipal UserAccount me) {
        return svc.list(me.getId());
    }

    @GetMapping("/slots")
    public SlotsRes slots(@AuthenticationPrincipal UserAccount me, @RequestParam String svc,
                          @RequestParam(defaultValue = "any") String staff, @RequestParam String date,
                          @RequestParam(required = false) String exceptId) {
        return this.svc.slots(me.getId(), svc, staff, date, exceptId);
    }

    @PostMapping("/vouchers/check")
    public VoucherRes check(@Valid @RequestBody VoucherReq r) {
        return svc.checkVoucher(r.svc(), r.code());
    }

    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public ApptDto create(@AuthenticationPrincipal UserAccount me, @Valid @RequestBody CreateReq r) {
        return svc.create(me.getId(), r);
    }

    @PutMapping("/appointments/{id}/reschedule")
    public ApptDto reschedule(@AuthenticationPrincipal UserAccount me, @PathVariable String id,
                              @Valid @RequestBody RescheduleReq r) {
        return svc.reschedule(me.getId(), id, r);
    }

    @PostMapping("/appointments/{id}/cancel")
    public ApptDto cancel(@AuthenticationPrincipal UserAccount me, @PathVariable String id,
                          @Valid @RequestBody(required = false) CancelReq r) {
        return svc.cancel(me.getId(), id, r == null ? null : r.reason());
    }

    @PostMapping("/appointments/{id}/rating")
    public ApptDto rate(@AuthenticationPrincipal UserAccount me, @PathVariable String id,
                        @Valid @RequestBody RatingReq r) {
        return svc.rate(me.getId(), id, r);
    }
}
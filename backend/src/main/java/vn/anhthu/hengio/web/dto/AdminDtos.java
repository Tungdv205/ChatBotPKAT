package vn.anhthu.hengio.web.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import vn.anhthu.hengio.web.dto.AppointmentDtos.ApptDto;

/** Dữ liệu cho trang quản trị. Trong danh sách số điện thoại luôn bị che, chỉ xem đủ ở trang chi tiết (và được ghi nhật ký). */
public final class AdminDtos {
    private AdminDtos() {}

    public record PageRes<T>(List<T> items, long total, int page, int size) {}

    public record CustomerRow(Long id, String name, String email, String phone, boolean locked, long created, long appts) {}

    public record CustomerDetail(Long id, String name, String email, String phone, String dob, String gender,
                                 boolean locked, boolean remind, boolean promo, long created, List<ApptDto> appts) {}

    public record CustomerEditReq(
            @NotBlank(message = "Hãy nhập họ tên.") @Size(max = 100, message = "Họ tên quá dài.") String name,
            @Pattern(regexp = "^([0-9+ ]{9,15})?$", message = "Số điện thoại chưa đúng.") String phone,
            @Pattern(regexp = "^(\\d{4}-\\d{2}-\\d{2})?$", message = "Ngày sinh chưa đúng định dạng.") String dob,
            @Pattern(regexp = "^(Nam|Nữ|Khác)?$", message = "Giới tính chưa đúng.") String gender) {}

    public record LockReq(boolean locked) {}

    public record ConfirmReq(@NotBlank(message = "Hãy nhập mật khẩu quản trị để xác nhận.") String password) {}

    public record AdminApptDto(String id, String svc, String svcName, String staff, String date, String time, int dur,
                               String status, long total, String code, String note, String cancelReason,
                               Long userId, String customer, String phone) {}

    public record CancelReasonReq(
            @NotBlank(message = "Hãy nhập lý do hủy.") @Size(max = 200, message = "Lý do tối đa 200 ký tự.") String reason) {}

    public record DayCount(String date, long count) {}

    public record StatsRes(long customers, long upcoming, long done, long cancelled, long today, long revenue,
                           long openTickets, List<DayCount> week) {}

    public record AuditDto(Long id, String admin, String action, String target, String detail, long ts) {}
}
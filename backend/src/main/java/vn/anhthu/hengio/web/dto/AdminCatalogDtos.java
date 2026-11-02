package vn.anhthu.hengio.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Dữ liệu quản lý danh mục (dịch vụ, mã ưu đãi, nhân sự) và yêu cầu hỗ trợ ở trang quản trị. */
public final class AdminCatalogDtos {
    private AdminCatalogDtos() {}

    // ----- Dịch vụ -----
    public record ServiceReq(
            @NotBlank(message = "Hãy nhập tên dịch vụ.") @Size(max = 200, message = "Tên dịch vụ quá dài.") String name,
            @NotBlank(message = "Hãy chọn chuyên khoa.") String cat,
            @Min(value = 15, message = "Thời gian tối thiểu 15 phút.") @Max(value = 270, message = "Thời gian tối đa 270 phút.") int dur,
            @Min(value = 0, message = "Giá không hợp lệ.") @Max(value = 100000000, message = "Giá quá lớn.") long price,
            boolean hot,
            @Size(max = 1000, message = "Mô tả tối đa 1000 ký tự.") String desc,
            @Size(max = 8, message = "Tối đa 8 mục trong phần bao gồm.") List<@Size(max = 150, message = "Mỗi mục tối đa 150 ký tự.") String> inc,
            Boolean active) {}

    public record ServiceAdmin(String id, String cat, String name, int dur, long price, boolean hot, String desc,
                               List<String> inc, boolean active) {}

    // ----- Mã ưu đãi -----
    public record VoucherReq(
            @Pattern(regexp = "^[A-Za-z0-9]{3,20}$", message = "Mã gồm 3 đến 20 chữ hoặc số, không dấu.") String code,
            @NotBlank(message = "Hãy nhập tiêu đề.") @Size(max = 200, message = "Tiêu đề quá dài.") String title,
            @Pattern(regexp = "^(pct|fix)$", message = "Loại giảm giá là pct (phần trăm) hoặc fix (số tiền).") String type,
            @Min(value = 1, message = "Mức giảm phải lớn hơn 0.") long val,
            @Min(value = 0, message = "Mức giảm tối đa không hợp lệ.") long max,
            @Min(value = 0, message = "Đơn tối thiểu không hợp lệ.") long min,
            String cat,
            @Size(max = 300, message = "Ghi chú tối đa 300 ký tự.") String note,
            Boolean active) {}

    public record VoucherAdmin(String code, String title, String type, long val, long max, long min, String cat,
                               String note, boolean active) {}

    // ----- Nhân sự -----
    public record StaffReq(
            @NotBlank(message = "Hãy nhập họ tên.") @Size(max = 120, message = "Họ tên quá dài.") String name,
            @Size(max = 200, message = "Chức danh quá dài.") String role,
            @NotEmpty(message = "Hãy chọn ít nhất một chuyên khoa.") List<String> cats,
            @DecimalMin(value = "0", message = "Điểm đánh giá từ 0 đến 5.") @DecimalMax(value = "5", message = "Điểm đánh giá từ 0 đến 5.") double rating,
            @Min(value = 0, message = "Số năm kinh nghiệm không hợp lệ.") @Max(value = 60, message = "Số năm kinh nghiệm không hợp lệ.") int years,
            Boolean active) {}

    public record StaffAdmin(String id, String name, String role, List<String> cats, double rating, int years,
                             boolean active) {}

    // ----- Yêu cầu hỗ trợ -----
    public record TicketAdmin(String id, String topic, String msg, long ts, String status, String reply, Long userId,
                              String customer, String phone) {}

    public record ReplyReq(
            @NotBlank(message = "Hãy nhập nội dung trả lời.") @Size(max = 800, message = "Nội dung tối đa 800 ký tự.") String reply) {}
}
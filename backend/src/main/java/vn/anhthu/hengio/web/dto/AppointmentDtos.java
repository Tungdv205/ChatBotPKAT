package vn.anhthu.hengio.web.dto;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Dữ liệu đặt lịch. Tên trường khớp với giao diện React (svc, staff, date,
 * time, discount, code, total...).
 */
public final class AppointmentDtos {

    private AppointmentDtos() {
    }

    public record CreateReq(
            @NotBlank String svc,
            @NotBlank String staff,
            @NotBlank String date,
            @NotBlank String time,
            @Size(max = 30) String code,
            @Size(max = 500) String note,
            @Size(max = 100) String contactName,
            @Size(max = 20) String contactPhone) {}

    public record RescheduleReq(@NotBlank String staff, @NotBlank String date, @NotBlank String time) {}

    public record CancelReq(@Size(max = 300) String reason) {}

    public record RatingReq(@Min(1)
            @Max(5) int stars, @Size(max = 500) String comment) {}

    public record VoucherReq(@NotBlank String svc, @NotBlank String code) {}

    public record VoucherRes(String code, String title, long discount, long total) {}

        public record ApptDto(String id, String svc, String svcName, String staff, String date, String time, int dur,
                          String status, long discount, String code, long total, String note, Integer rating,
                          String ratingComment, String cancelReason, String contactName, String contactPhone) {}
    /**
     * Một khung giờ: state là ok | closed | past | mine | busy.
     */
    public record SlotDto(String time, String state) {}

    public record SlotsRes(String date, List<SlotDto> slots) {}
}

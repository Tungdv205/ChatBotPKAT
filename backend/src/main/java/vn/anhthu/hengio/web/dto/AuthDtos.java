package vn.anhthu.hengio.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Dữ liệu giao diện gửi lên (...Req) và nhận về (UserDto, AuthRes) cho nhóm đăng nhập và hồ sơ. */
public final class AuthDtos {
    private AuthDtos() {}

    public static final String PASSWORD_RULE = "^(?=.*[A-Za-z])(?=.*\\d).{8,64}$";
    public static final String PASSWORD_MSG = "Mật khẩu cần 8 đến 64 ký tự, gồm cả chữ và số.";
    public static final String PHONE_RULE = "^[0-9+ ]{9,15}$";

    public record RegisterReq(
            @NotBlank(message = "Hãy nhập họ tên.") @Size(max = 100, message = "Họ tên quá dài.") String name,
            @NotBlank(message = "Hãy nhập email.") @Email(message = "Email chưa đúng định dạng.")
                    @Size(max = 190, message = "Email quá dài.") String email,
            @NotBlank(message = "Hãy nhập số điện thoại.")
                    @Pattern(regexp = PHONE_RULE, message = "Số điện thoại chưa đúng.") String phone,
            @NotBlank(message = "Hãy nhập mật khẩu.") @Pattern(regexp = PASSWORD_RULE, message = PASSWORD_MSG) String password) {}

    public record LoginReq(
            @NotBlank(message = "Hãy nhập email.") String email,
            @NotBlank(message = "Hãy nhập mật khẩu.") String password) {}

    public record ForgotReq(@NotBlank(message = "Hãy nhập email.") String email) {}

    public record ResetReq(
            @NotBlank(message = "Thiếu mã đặt lại mật khẩu.") String token,
            @NotBlank(message = "Hãy nhập mật khẩu mới.") @Pattern(regexp = PASSWORD_RULE, message = PASSWORD_MSG) String password) {}

    public record ProfileReq(
            @NotBlank(message = "Hãy nhập họ tên.") @Size(max = 100, message = "Họ tên quá dài.") String name,
            @Pattern(regexp = "^([0-9+ ]{9,15})?$", message = "Số điện thoại chưa đúng.") String phone,
            @Pattern(regexp = "^(\\d{4}-\\d{2}-\\d{2})?$", message = "Ngày sinh chưa đúng định dạng.") String dob,
            @Pattern(regexp = "^(Nam|Nữ|Khác)?$", message = "Giới tính chưa đúng.") String gender,
            Boolean remind,
            Boolean promo) {}

    public record PasswordReq(
            @NotBlank(message = "Hãy nhập mật khẩu hiện tại.") String current,
            @NotBlank(message = "Hãy nhập mật khẩu mới.") @Pattern(regexp = PASSWORD_RULE, message = PASSWORD_MSG) String password) {}

    public record DeleteReq(@NotBlank(message = "Hãy nhập mật khẩu để xác nhận.") String password) {}

    public record Settings(boolean remind, boolean promo) {}

    public record UserDto(
            Long id,
            String name,
            String email,
            String phone,
            String dob,
            String gender,
            String role,
            Settings settings,
            long created) {}

    public record AuthRes(String token, UserDto user) {}
}
package vn.anhthu.hengio.web;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.anhthu.hengio.model.UserAccount;
import vn.anhthu.hengio.service.AuthService;
import vn.anhthu.hengio.web.dto.AuthDtos.AuthRes;
import vn.anhthu.hengio.web.dto.AuthDtos.DeleteReq;
import vn.anhthu.hengio.web.dto.AuthDtos.PasswordReq;
import vn.anhthu.hengio.web.dto.AuthDtos.ProfileReq;
import vn.anhthu.hengio.web.dto.AuthDtos.UserDto;

/** Hồ sơ của người đang đăng nhập. Mọi API ở đây yêu cầu token. */
@RestController
@RequestMapping("/api/me")
public class MeController {
    private final AuthService auth;

    public MeController(AuthService auth) {
        this.auth = auth;
    }

    @GetMapping
    public UserDto me(@AuthenticationPrincipal UserAccount me) {
        return auth.profile(me.getId());
    }

    @PutMapping
    public UserDto update(@AuthenticationPrincipal UserAccount me, @Valid @RequestBody ProfileReq r) {
        return auth.updateProfile(me.getId(), r);
    }

    @PutMapping("/password")
    public AuthRes changePassword(@AuthenticationPrincipal UserAccount me, @Valid @RequestBody PasswordReq r) {
        return auth.changePassword(me.getId(), r.current(), r.password());
    }

    @DeleteMapping
    public Map<String, String> delete(@AuthenticationPrincipal UserAccount me, @Valid @RequestBody DeleteReq r) {
        auth.deleteAccount(me.getId(), r.password());
        return Map.of("message", "Đã xóa tài khoản và dữ liệu cá nhân của bạn.");
    }
}
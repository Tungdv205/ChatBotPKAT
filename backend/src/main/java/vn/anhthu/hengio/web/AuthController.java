package vn.anhthu.hengio.web;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.anhthu.hengio.service.AuthService;
import vn.anhthu.hengio.web.dto.AuthDtos.AuthRes;
import vn.anhthu.hengio.web.dto.AuthDtos.ForgotReq;
import vn.anhthu.hengio.web.dto.AuthDtos.LoginReq;
import vn.anhthu.hengio.web.dto.AuthDtos.RegisterReq;
import vn.anhthu.hengio.web.dto.AuthDtos.ResetReq;

/** Các API không cần đăng nhập: đăng ký, đăng nhập, quên và đặt lại mật khẩu. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    public AuthRes register(@Valid @RequestBody RegisterReq r) {
        return auth.register(r);
    }

    @PostMapping("/login")
    public AuthRes login(@Valid @RequestBody LoginReq r) {
        return auth.login(r);
    }

    @PostMapping("/forgot")
    public Map<String, String> forgot(@Valid @RequestBody ForgotReq r) {
        auth.forgot(r.email());
        return Map.of("message", "Nếu email có tài khoản, hướng dẫn đặt lại mật khẩu đã được gửi.");
    }

    @PostMapping("/reset")
    public Map<String, String> reset(@Valid @RequestBody ResetReq r) {
        auth.reset(r.token(), r.password());
        return Map.of("message", "Đã đổi mật khẩu. Hãy đăng nhập lại.");
    }
}
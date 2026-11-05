package vn.anhthu.hengio.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Kiểm tra máy chủ còn thức (dùng cho dịch vụ ping). Không truy cập database. */
@RestController
public class PingController {
    @GetMapping("/api/ping")
    public String ping() {
        return "ok";
    }
}
package vn.anhthu.hengio.security;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Giới hạn số lần gọi các API đăng nhập/đăng ký/quên mật khẩu theo địa chỉ IP (chống dò mật khẩu hàng loạt).
 * Bản đơn giản lưu trong bộ nhớ một máy chủ; nếu chạy nhiều máy chủ, nên chuyển sang Redis hoặc cổng API.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private static final int MAX_PER_MINUTE = 30;

    private static final class Bucket {
        long windowStart;
        int count;
    }

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        return !req.getRequestURI().startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        long now = System.currentTimeMillis();
        if (buckets.size() > 10_000) buckets.clear();
        Bucket b = buckets.computeIfAbsent(req.getRemoteAddr(), k -> new Bucket());
        boolean blocked;
        synchronized (b) {
            if (now - b.windowStart > 60_000) {
                b.windowStart = now;
                b.count = 0;
            }
            b.count++;
            blocked = b.count > MAX_PER_MINUTE;
        }
        if (blocked) {
            res.setStatus(429);
            res.setContentType("application/json;charset=UTF-8");
            res.getWriter().write("{\"error\":\"Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.\"}");
            return;
        }
        chain.doFilter(req, res);
    }
}
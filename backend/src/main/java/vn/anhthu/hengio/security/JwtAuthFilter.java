package vn.anhthu.hengio.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.anhthu.hengio.model.UserAccount;
import vn.anhthu.hengio.repo.UserRepository;

/** Đọc header "Authorization: Bearer <token>", nếu hợp lệ thì đặt người dùng vào SecurityContext. */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    private final UserRepository users;

    public JwtAuthFilter(JwtService jwt, UserRepository users) {
        this.jwt = jwt;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String h = req.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer ") && SecurityContextHolder.getContext().getAuthentication() == null) {
            jwt.parse(h.substring(7).trim()).ifPresent(p -> {
                UserAccount u = users.findById(p.userId()).orElse(null);
                // Token chỉ có hiệu lực khi tài khoản còn tồn tại, chưa bị khóa và chưa đổi mật khẩu sau khi cấp token
                if (u != null && u.isEnabled() && u.getTokenVersion() == p.version()) {
                    var auth = new UsernamePasswordAuthenticationToken(
                            u, null, List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name())));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            });
        }
        chain.doFilter(req, res);
    }
}
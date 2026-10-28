package vn.anhthu.hengio.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;
import vn.anhthu.hengio.config.AppProperties;
import vn.anhthu.hengio.model.UserAccount;

/** Tạo và kiểm tra token đăng nhập (JWT, ký HMAC-SHA256). */
@Service
public class JwtService {
    public record Parsed(long userId, int version) {}

    private final SecretKey key;
    private final long ttlMinutes;

    public JwtService(AppProperties props) {
        if (props.jwtSecret() == null || props.jwtSecret().isBlank()) {
            throw new IllegalStateException("Thiếu JWT_SECRET. Tạo khóa bằng: openssl rand -base64 48");
        }
        byte[] bytes = Decoders.BASE64.decode(props.jwtSecret().trim());
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET phải dài tối thiểu 32 byte (Base64).");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.ttlMinutes = props.jwtExpireMinutes();
    }

    public String issue(UserAccount u) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(u.getId()))
                .claim("role", u.getRole().name())
                .claim("v", u.getTokenVersion())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttlMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public Optional<Parsed> parse(String token) {
        try {
            Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            Integer v = c.get("v", Integer.class);
            return Optional.of(new Parsed(Long.parseLong(c.getSubject()), v == null ? 0 : v));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
package vn.anhthu.hengio.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.anhthu.hengio.config.ApiException;
import vn.anhthu.hengio.config.AppProperties;
import vn.anhthu.hengio.model.ResetToken;
import vn.anhthu.hengio.model.Role;
import vn.anhthu.hengio.model.UserAccount;
import vn.anhthu.hengio.repo.ResetTokenRepository;
import vn.anhthu.hengio.repo.UserRepository;
import vn.anhthu.hengio.security.JwtService;
import vn.anhthu.hengio.web.dto.AuthDtos.AuthRes;
import vn.anhthu.hengio.web.dto.AuthDtos.LoginReq;
import vn.anhthu.hengio.web.dto.AuthDtos.ProfileReq;
import vn.anhthu.hengio.web.dto.AuthDtos.RegisterReq;
import vn.anhthu.hengio.web.dto.AuthDtos.Settings;
import vn.anhthu.hengio.web.dto.AuthDtos.UserDto;

/** Đăng ký, đăng nhập, quên mật khẩu, hồ sơ cá nhân. */
@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final int MAX_FAILED = 5;
    private static final Duration LOCK_TIME = Duration.ofMinutes(15);
    private static final Duration RESET_TTL = Duration.ofMinutes(30);
    private static final String BAD_LOGIN = "Email hoặc mật khẩu chưa đúng.";

    private final UserRepository users;
    private final ResetTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AppProperties props;
    private final SecureRandom random = new SecureRandom();
    private final String dummyHash; // so khớp giả khi email không tồn tại, để thời gian phản hồi không lộ email nào có tài khoản

    public AuthService(UserRepository users, ResetTokenRepository tokens, PasswordEncoder encoder,
                       JwtService jwt, AppProperties props) {
        this.users = users;
        this.tokens = tokens;
        this.encoder = encoder;
        this.jwt = jwt;
        this.props = props;
        this.dummyHash = encoder.encode("mat-khau-gia-de-chong-do-email");
    }

    public static UserDto toDto(UserAccount u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), nz(u.getPhone()), nz(u.getDob()), nz(u.getGender()),
                u.getRole().name(), new Settings(u.isRemind(), u.isPromo()), u.getCreatedAt().toEpochMilli());
    }

    private static String nz(String s) {
        return s == null ? "" : s;
    }

    private static String normEmail(String email) {
        return email.trim().toLowerCase();
    }

    @Transactional
    public AuthRes register(RegisterReq r) {
        String email = normEmail(r.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("Email này đã có tài khoản. Hãy đăng nhập.");
        }
        UserAccount u = new UserAccount();
        u.setName(r.name().trim());
        u.setEmail(email);
        u.setPhone(r.phone().trim());
        u.setPasswordHash(encoder.encode(r.password()));
        u.setRole(Role.CUSTOMER);
        users.save(u);
        return new AuthRes(jwt.issue(u), toDto(u));
    }

    /** noRollbackFor: vẫn lưu số lần nhập sai dù hàm kết thúc bằng lỗi 401. */
    @Transactional(noRollbackFor = ApiException.class)
    public AuthRes login(LoginReq r) {
        UserAccount u = users.findByEmailIgnoreCase(normEmail(r.email())).orElse(null);
        if (u == null) {
            encoder.matches(r.password(), dummyHash);
            throw new ApiException(401, BAD_LOGIN);
        }
        Instant now = Instant.now();
        if (u.getLockedUntil() != null && u.getLockedUntil().isAfter(now)) {
            long min = Math.max(1, Duration.between(now, u.getLockedUntil()).toMinutes() + 1);
            throw new ApiException(429, "Bạn đã nhập sai nhiều lần. Tài khoản tạm khóa, thử lại sau " + min + " phút.");
        }
        if (!encoder.matches(r.password(), u.getPasswordHash())) {
            u.setFailedLogins(u.getFailedLogins() + 1);
            if (u.getFailedLogins() >= MAX_FAILED) {
                u.setLockedUntil(now.plus(LOCK_TIME));
                u.setFailedLogins(0);
            }
            users.save(u);
            throw new ApiException(401, BAD_LOGIN);
        }
        if (!u.isEnabled()) {
            throw ApiException.forbidden("Tài khoản đã bị khóa. Vui lòng liên hệ phòng khám.");
        }
        u.setFailedLogins(0);
        u.setLockedUntil(null);
        users.save(u);
        return new AuthRes(jwt.issue(u), toDto(u));
    }

    /** Luôn trả kết quả giống nhau dù email có tồn tại hay không. */
    @Transactional
    public void forgot(String emailRaw) {
        users.findByEmailIgnoreCase(normEmail(emailRaw)).filter(UserAccount::isEnabled).ifPresent(u -> {
            tokens.deleteByUserId(u.getId());
            byte[] raw = new byte[32];
            random.nextBytes(raw);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
            ResetToken t = new ResetToken();
            t.setUserId(u.getId());
            t.setTokenHash(sha256(token));
            t.setExpiresAt(Instant.now().plus(RESET_TTL));
            tokens.save(t);
            String base = props.corsOrigins().split(",")[0].trim();
            // Bản thật: gửi email chứa liên kết này. Bản thử: ghi ra log để bạn mở thử.
            log.info("[THU NGHIEM] Lien ket dat lai mat khau cho {}: {}/?reset={}", u.getEmail(), base, token);
        });
    }

    @Transactional
    public void reset(String token, String newPassword) {
        ResetToken t = tokens.findByTokenHash(sha256(token)).orElseThrow(
                () -> ApiException.bad("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."));
        if (t.getExpiresAt().isBefore(Instant.now())) {
            tokens.delete(t);
            throw ApiException.bad("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        }
        UserAccount u = users.findById(t.getUserId()).orElseThrow(
                () -> ApiException.bad("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."));
        u.setPasswordHash(encoder.encode(newPassword));
        u.setTokenVersion(u.getTokenVersion() + 1); // các token đăng nhập cũ hết hiệu lực
        u.setFailedLogins(0);
        u.setLockedUntil(null);
        users.save(u);
        tokens.delete(t);
    }

    @Transactional(readOnly = true)
    public UserDto profile(Long id) {
        return toDto(load(id));
    }

    @Transactional
    public UserDto updateProfile(Long id, ProfileReq r) {
        UserAccount u = load(id);
        u.setName(r.name().trim());
        u.setPhone(nz(r.phone()).trim());
        u.setDob(nz(r.dob()));
        u.setGender(nz(r.gender()));
        if (r.remind() != null) u.setRemind(r.remind());
        if (r.promo() != null) u.setPromo(r.promo());
        users.save(u);
        return toDto(u);
    }

    @Transactional
    public AuthRes changePassword(Long id, String current, String newPassword) {
        UserAccount u = load(id);
        if (!encoder.matches(current, u.getPasswordHash())) {
            throw ApiException.bad("Mật khẩu hiện tại chưa đúng.");
        }
        u.setPasswordHash(encoder.encode(newPassword));
        u.setTokenVersion(u.getTokenVersion() + 1);
        users.save(u);
        return new AuthRes(jwt.issue(u), toDto(u)); // cấp token mới để người dùng không bị đăng xuất
    }

    /** Khách tự xóa tài khoản. Dữ liệu liên quan (lịch hẹn, thông báo...) sẽ được xóa kèm ở các phần sau. */
    @Transactional
    public void deleteAccount(Long id, String password) {
        UserAccount u = load(id);
        if (u.getRole() == Role.ADMIN) {
            throw ApiException.forbidden("Tài khoản quản trị không thể tự xóa.");
        }
        if (!encoder.matches(password, u.getPasswordHash())) {
            throw ApiException.bad("Mật khẩu chưa đúng.");
        }
        tokens.deleteByUserId(id);
        users.delete(u);
    }

    private UserAccount load(Long id) {
        return users.findById(id).orElseThrow(() -> new ApiException(401, "Phiên đăng nhập không còn hiệu lực."));
    }

    private static String sha256(String s) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(d);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
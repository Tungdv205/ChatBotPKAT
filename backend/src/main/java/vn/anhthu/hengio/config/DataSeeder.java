package vn.anhthu.hengio.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.anhthu.hengio.model.Role;
import vn.anhthu.hengio.model.UserAccount;
import vn.anhthu.hengio.repo.UserRepository;

/** Chạy một lần khi khởi động: tạo tài khoản quản trị (và tài khoản khách dùng thử nếu bật) khi chưa có. */
@Component
public class DataSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AppProperties props;

    public DataSeeder(UserRepository users, PasswordEncoder encoder, AppProperties props) {
        this.users = users;
        this.encoder = encoder;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedAdmin();
        if (props.seedDemo()) {
            seedDemoCustomer();
        }
    }

    private void seedAdmin() {
        String email = props.adminEmail();
        String pass = props.adminPassword();
        if (email == null || email.isBlank() || pass == null || pass.isBlank()) {
            log.warn("Chưa cấu hình ADMIN_EMAIL / ADMIN_PASSWORD nên không tạo tài khoản quản trị.");
            return;
        }
        if (users.existsByEmailIgnoreCase(email)) {
            return;
        }
        UserAccount a = new UserAccount();
        a.setName(props.adminName());
        a.setEmail(email.trim().toLowerCase());
        a.setPasswordHash(encoder.encode(pass));
        a.setRole(Role.ADMIN);
        users.save(a);
        log.info("Đã tạo tài khoản quản trị: {}", a.getEmail());
    }

    private void seedDemoCustomer() {
        String email = "demo@henlich.vn";
        if (users.existsByEmailIgnoreCase(email)) {
            return;
        }
        UserAccount u = new UserAccount();
        u.setName("Nguyễn Thanh Mai");
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(props.demoPassword()));
        u.setPhone("0912345678");
        u.setDob("1995-04-12");
        u.setGender("Nữ");
        users.save(u);
        log.info("Đã tạo khách hàng dùng thử: {}", email);
    }
}
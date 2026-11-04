package vn.anhthu.hengio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Các cấu hình riêng của ứng dụng, đọc từ mục "app" trong application.yml. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String jwtSecret,
        @DefaultValue("120") int jwtExpireMinutes,
        String encKey,
        @DefaultValue("http://localhost:5173") String corsOrigins,
        String adminEmail,
        String adminPassword,
        @DefaultValue("Quản trị viên") String adminName,
        boolean seedDemo,
        @DefaultValue("demo1234") String demoPassword,
        @DefaultValue("") String mailScriptUrl,
        @DefaultValue("") String mailScriptToken,
        @DefaultValue("Phòng khám Anh Thu") String mailFromName) {
}
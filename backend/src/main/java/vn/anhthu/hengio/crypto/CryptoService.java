package vn.anhthu.hengio.crypto;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Component;

import vn.anhthu.hengio.config.AppProperties;

/**
 * Mã hóa AES-256-GCM cho thông tin nhạy cảm của khách hàng (số điện thoại, ngày sinh, ghi chú khám...).
 * Mỗi lần mã hóa dùng một IV ngẫu nhiên riêng; GCM còn phát hiện được dữ liệu bị sửa trực tiếp trong database.
 * Mất khóa APP_ENC_KEY là không giải mã lại được dữ liệu, nên phải sao lưu khóa này ở nơi an toàn.
 */
@Component
public class CryptoService {
    private static volatile CryptoService instance;

    private final SecretKeySpec key;
    private final SecureRandom random = new SecureRandom();

    public CryptoService(AppProperties props) {
        if (props.encKey() == null || props.encKey().isBlank()) {
            throw new IllegalStateException("Thiếu APP_ENC_KEY. Tạo khóa bằng: openssl rand -base64 32");
        }
        byte[] k = Base64.getDecoder().decode(props.encKey().trim());
        if (k.length != 32) {
            throw new IllegalStateException("APP_ENC_KEY phải là Base64 của đúng 32 byte (AES-256).");
        }
        this.key = new SecretKeySpec(k, "AES");
        instance = this;
    }

    public static CryptoService get() {
        if (instance == null) {
            throw new IllegalStateException("CryptoService chưa khởi tạo");
        }
        return instance;
    }

    public String encrypt(String plain) {
        if (plain == null) return null;
        try {
            byte[] iv = new byte[12];
            random.nextBytes(iv);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
            byte[] ct = c.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            ByteBuffer buf = ByteBuffer.allocate(iv.length + ct.length);
            buf.put(iv).put(ct);
            return Base64.getEncoder().encodeToString(buf.array());
        } catch (Exception e) {
            throw new IllegalStateException("Không mã hóa được dữ liệu", e);
        }
    }

    public String decrypt(String data) {
        if (data == null) return null;
        try {
            byte[] all = Base64.getDecoder().decode(data);
            byte[] iv = new byte[12];
            System.arraycopy(all, 0, iv, 0, 12);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv));
            return new String(c.doFinal(all, 12, all.length - 12), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Không giải mã được dữ liệu (sai khóa APP_ENC_KEY hoặc dữ liệu bị sửa)", e);
        }
    }
}
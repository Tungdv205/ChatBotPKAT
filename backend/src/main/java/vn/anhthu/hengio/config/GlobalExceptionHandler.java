package vn.anhthu.hengio.config;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Biến mọi lỗi thành JSON { "error": "..." } dễ đọc cho giao diện. */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static ResponseEntity<Map<String, String>> err(int status, String msg) {
        return ResponseEntity.status(status).body(Map.of("error", msg));
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, String>> api(ApiException e) {
        return err(e.getStatus(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> invalid(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getDefaultMessage())
                .findFirst()
                .orElse("Dữ liệu chưa hợp lệ.");
        return err(400, msg);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> unreadable(HttpMessageNotReadableException e) {
        return err(400, "Dữ liệu gửi lên không hợp lệ.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> integrity(DataIntegrityViolationException e) {
        log.warn("Vi phạm ràng buộc dữ liệu", e);
        return err(409, "Dữ liệu bị trùng hoặc đang được sử dụng ở nơi khác.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> other(Exception e) {
        // Lỗi do yêu cầu sai của Spring (sai phương thức, không có đường dẫn...) giữ nguyên mã 4xx
        if (e instanceof ErrorResponse er) {
            return err(er.getStatusCode().value(), "Yêu cầu không hợp lệ.");
        }
        log.error("Lỗi không mong muốn", e);
        return err(500, "Hệ thống đang gặp sự cố, vui lòng thử lại sau.");
    }
}
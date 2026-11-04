package vn.anhthu.hengio.service;

import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.HtmlUtils;

import vn.anhthu.hengio.config.AppProperties;

/** Gửi email qua Google Apps Script (gửi thẳng từ Gmail của phòng khám). Chạy nền, lỗi chỉ ghi log. */
@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final AppProperties props;
    private final RestClient http = RestClient.create();

    public EmailService(AppProperties props) {
        this.props = props;
    }

    @Async
    public void sendBooking(String toEmail, String toName, String title, String id, String service,
                            String when, long total, String code) {
        if (isBlank(props.mailScriptUrl()) || isBlank(props.mailScriptToken()) || isBlank(toEmail)) {
            log.info("Chưa cấu hình gửi email, bỏ qua.");
            return;
        }
        String name = isBlank(toName) ? "bạn" : toName;
        String price = String.format(Locale.GERMANY, "%,d", total) + "đ";
        String html = "<div style=\"font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#12303a\">"
                + "<h2 style=\"color:#0d9488\">" + esc(title) + "</h2>"
                + "<p>Xin chào " + esc(name) + ", thông tin lịch hẹn của bạn tại Phòng khám đa khoa Anh Thu:</p>"
                + "<table style=\"border-collapse:collapse;width:100%\">"
                + row("Mã lịch hẹn", id)
                + row("Dịch vụ", service)
                + row("Thời gian", when)
                + (isBlank(code) ? "" : row("Mã ưu đãi", code))
                + row("Thành tiền", price)
                + "</table>"
                + "<p style=\"margin-top:16px\">Vui lòng đến trước giờ hẹn 10 phút. "
                + "Đổi hoặc hủy lịch cần thực hiện trước giờ hẹn ít nhất 2 giờ.</p>"
                + "<p style=\"color:#667\">Phòng khám đa khoa Anh Thu</p></div>";
        try {
            Map<String, Object> body = Map.of(
                    "token", props.mailScriptToken(),
                    "to", toEmail,
                    "subject", title + " - mã " + id,
                    "html", html,
                    "fromName", props.mailFromName());
            http.post().uri(props.mailScriptUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Không gửi được email lịch hẹn {}: {}", id, e.getMessage());
        }
    }

    private static String row(String k, String v) {
        return "<tr><td style=\"padding:8px;border-bottom:1px solid #e3eef0;color:#667\">" + k
                + "</td><td style=\"padding:8px;border-bottom:1px solid #e3eef0\"><b>" + esc(v) + "</b></td></tr>";
    }

    private static String esc(String s) {
        return HtmlUtils.htmlEscape(s == null ? "" : s);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
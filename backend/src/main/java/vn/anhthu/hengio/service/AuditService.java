package vn.anhthu.hengio.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.anhthu.hengio.model.AuditLog;
import vn.anhthu.hengio.repo.AuditLogRepository;
import vn.anhthu.hengio.web.dto.AdminDtos.AuditDto;

/** Ghi và đọc nhật ký thao tác của quản trị viên. */
@Service
public class AuditService {
    private final AuditLogRepository repo;

    public AuditService(AuditLogRepository repo) {
        this.repo = repo;
    }

    /** Ghi cùng giao dịch với thao tác chính: thao tác thất bại thì nhật ký cũng không được ghi nhầm. */
    @Transactional
    public void log(String adminEmail, String action, String target, String detail) {
        AuditLog a = new AuditLog();
        a.setAdminEmail(adminEmail);
        a.setAction(action);
        a.setTarget(target);
        a.setDetail(detail);
        repo.save(a);
    }

    @Transactional(readOnly = true)
    public List<AuditDto> recent() {
        return repo.findTop200ByOrderByCreatedAtDesc().stream()
                .map(a -> new AuditDto(a.getId(), a.getAdminEmail(), a.getAction(), a.getTarget(), a.getDetail(),
                        a.getCreatedAt().toEpochMilli()))
                .toList();
    }
}
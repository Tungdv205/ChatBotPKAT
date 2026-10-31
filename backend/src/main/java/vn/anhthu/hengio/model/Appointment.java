package vn.anhthu.hengio.model;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import vn.anhthu.hengio.crypto.EncryptedStringConverter;

/** Một lịch hẹn khám. Giá và thời lượng được lưu lại tại thời điểm đặt, nên đổi giá dịch vụ sau này không ảnh hưởng lịch cũ. */
@Entity
@Table(name = "appointments", indexes = {
        @Index(name = "ix_appt_user", columnList = "user_id"),
        @Index(name = "ix_appt_staff_date", columnList = "staff_id,date")
})
public class Appointment {

    @Id
    @Column(length = 20)
    private String id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Mã dịch vụ, nhiều dịch vụ nối bằng dấu + (ví dụ s1+s12). */
    @Column(name = "service_key", nullable = false, length = 100)
    private String serviceKey;

    @Column(name = "service_name", nullable = false, length = 500)
    private String serviceName;

    @Column(name = "staff_id", nullable = false, length = 20)
    private String staffId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "start_min", nullable = false)
    private int startMin;

    @Column(name = "duration_min", nullable = false)
    private int durationMin;

    private long discount;

    @Column(length = 30)
    private String code;

    private long total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApptStatus status = ApptStatus.UPCOMING;

    /** Ghi chú triệu chứng của khách: mã hóa trong database. */
    @Convert(converter = EncryptedStringConverter.class)
    @Column(length = 3000)
    private String note;

    private Integer rating;

    @Column(name = "rating_comment", length = 500)
    private String ratingComment;

    @Column(name = "cancel_reason", length = 300)
    private String cancelReason;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getServiceKey() {
        return serviceKey;
    }

    public void setServiceKey(String serviceKey) {
        this.serviceKey = serviceKey;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getStaffId() {
        return staffId;
    }

    public void setStaffId(String staffId) {
        this.staffId = staffId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public int getStartMin() {
        return startMin;
    }

    public void setStartMin(int startMin) {
        this.startMin = startMin;
    }

    public int getDurationMin() {
        return durationMin;
    }

    public void setDurationMin(int durationMin) {
        this.durationMin = durationMin;
    }

    public long getDiscount() {
        return discount;
    }

    public void setDiscount(long discount) {
        this.discount = discount;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public ApptStatus getStatus() {
        return status;
    }

    public void setStatus(ApptStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getRatingComment() {
        return ratingComment;
    }

    public void setRatingComment(String ratingComment) {
        this.ratingComment = ratingComment;
    }

    public String getCancelReason() {
        return cancelReason;
    }

    public void setCancelReason(String cancelReason) {
        this.cancelReason = cancelReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
package vn.anhthu.hengio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Mã ưu đãi. */
@Entity
@Table(name = "vouchers")
public class Voucher {

    @Id
    @Column(length = 30)
    private String code;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "discount_type", nullable = false, length = 10)
    private String discountType;

    @Column(name = "discount_value", nullable = false)
    private long discountValue;

    @Column(name = "max_discount")
    private long maxDiscount;

    @Column(name = "min_order")
    private long minOrder;

    @Column(name = "category_id", length = 20)
    private String categoryId;

    @Column(length = 300)
    private String note;

    private boolean active = true;

    // Getter/setter: dùng Source Action > Generate Getters and Setters
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDiscountType() {
        return discountType;
    }

    public void setDiscountType(String discountType) {
        this.discountType = discountType;
    }

    public long getDiscountValue() {
        return discountValue;
    }

    public void setDiscountValue(long discountValue) {
        this.discountValue = discountValue;
    }

    public long getMaxDiscount() {
        return maxDiscount;
    }

    public void setMaxDiscount(long maxDiscount) {
        this.maxDiscount = maxDiscount;
    }

    public long getMinOrder() {
        return minOrder;
    }

    public void setMinOrder(long minOrder) {
        this.minOrder = minOrder;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
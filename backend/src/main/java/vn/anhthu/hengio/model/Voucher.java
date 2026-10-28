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
}
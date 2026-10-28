package vn.anhthu.hengio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Một dịch vụ khám của phòng khám. */
@Entity
@Table(name = "services")
public class ServiceItem {

    @Id
    @Column(length = 20)
    private String id;

    @Column(name = "category_id", nullable = false, length = 20)
    private String categoryId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "duration_min", nullable = false)
    private int durationMin;

    @Column(nullable = false)
    private long price;

    private boolean hot;

    @Column(length = 1000)
    private String description;

    @Column(name = "includes_text", length = 1500)
    private String includesText;

    private boolean active = true;

    // Getter/setter: dùng Source Action > Generate Getters and Setters
}
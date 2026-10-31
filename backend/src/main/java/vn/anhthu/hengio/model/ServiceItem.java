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
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getDurationMin() {
        return durationMin;
    }

    public void setDurationMin(int durationMin) {
        this.durationMin = durationMin;
    }

    public long getPrice() {
        return price;
    }

    public void setPrice(long price) {
        this.price = price;
    }

    public boolean isHot() {
        return hot;
    }

    public void setHot(boolean hot) {
        this.hot = hot;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIncludesText() {
        return includesText;
    }

    public void setIncludesText(String includesText) {
        this.includesText = includesText;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
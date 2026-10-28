package vn.anhthu.hengio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Chuyên khoa / nhóm dịch vụ. */
@Entity
@Table(name = "categories")
public class Category {

    @Id
    @Column(length = 20)
    private String id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 30)
    private String icon;

    // Getter/setter: dùng Source Action > Generate Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }
}
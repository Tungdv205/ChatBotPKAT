package vn.anhthu.hengio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Bác sĩ hoặc kỹ thuật viên. */
@Entity
@Table(name = "staff_members")
public class Staff {

    @Id
    @Column(length = 20)
    private String id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "role_title", length = 200)
    private String roleTitle;

    @Column(name = "category_ids", length = 200)
    private String categories;

    private double rating;

    @Column(name = "experience_years")
    private int experienceYears;

    private boolean active = true;

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

    public String getRoleTitle() {
        return roleTitle;
    }

    public void setRoleTitle(String roleTitle) {
        this.roleTitle = roleTitle;
    }

    public String getCategories() {
        return categories;
    }

    public void setCategories(String categories) {
        this.categories = categories;
    }

    public double getRating() {
        return rating;
    }

    public void setRating(double rating) {
        this.rating = rating;
    }

    public int getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(int experienceYears) {
        this.experienceYears = experienceYears;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
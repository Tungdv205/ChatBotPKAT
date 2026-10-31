package vn.anhthu.hengio.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.anhthu.hengio.model.Category;

public interface CategoryRepository extends JpaRepository<Category, String> {
}
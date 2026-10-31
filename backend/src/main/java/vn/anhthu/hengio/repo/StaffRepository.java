package vn.anhthu.hengio.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.anhthu.hengio.model.Staff;

public interface StaffRepository extends JpaRepository<Staff, String> {
    List<Staff> findByActiveTrueOrderById();
}
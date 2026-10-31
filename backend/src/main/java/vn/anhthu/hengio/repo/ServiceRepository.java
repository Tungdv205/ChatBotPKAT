package vn.anhthu.hengio.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.anhthu.hengio.model.ServiceItem;

public interface ServiceRepository extends JpaRepository<ServiceItem, String> {
    List<ServiceItem> findByActiveTrueOrderById();
}
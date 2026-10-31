package vn.anhthu.hengio.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.anhthu.hengio.model.Voucher;

public interface VoucherRepository extends JpaRepository<Voucher, String> {
    List<Voucher> findByActiveTrueOrderByCode();
}
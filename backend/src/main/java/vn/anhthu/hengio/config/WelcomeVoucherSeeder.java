package vn.anhthu.hengio.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import vn.anhthu.hengio.model.Voucher;
import vn.anhthu.hengio.repo.VoucherRepository;
import vn.anhthu.hengio.service.AppointmentService;

/** Khi khởi động: tạo mã ưu đãi chào mừng nếu chưa có (không ghi đè nếu admin đã sửa). */
@Component
public class WelcomeVoucherSeeder implements ApplicationRunner {
    private final VoucherRepository vouchers;

    public WelcomeVoucherSeeder(VoucherRepository vouchers) {
        this.vouchers = vouchers;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (vouchers.existsById(AppointmentService.WELCOME_CODE)) {
            return;
        }
        Voucher v = new Voucher();
        v.setCode(AppointmentService.WELCOME_CODE);
        v.setTitle("Chào bạn mới: giảm 20% lịch khám đầu tiên");
        v.setDiscountType("pct");
        v.setDiscountValue(20);
        v.setMaxDiscount(100000);
        v.setMinOrder(0);
        v.setNote("Dành cho lần đặt lịch đầu tiên, giảm tối đa 100.000đ.");
        vouchers.save(v);
    }
}
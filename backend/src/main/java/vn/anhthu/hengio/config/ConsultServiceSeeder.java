package vn.anhthu.hengio.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import vn.anhthu.hengio.model.ServiceItem;
import vn.anhthu.hengio.repo.CategoryRepository;
import vn.anhthu.hengio.repo.ServiceRepository;

/**
 * Dịch vụ miễn phí "Tư vấn cùng nhân viên": chatbot đề xuất khi không trả lời được.
 * Chỉ tạo khi chưa có, không ghi đè chỉnh sửa của quản trị viên.
 */
@Component
@Order(2)
public class ConsultServiceSeeder implements ApplicationRunner {
    public static final String ID = "tuvan";
    private static final Logger log = LoggerFactory.getLogger(ConsultServiceSeeder.class);

    private final ServiceRepository services;
    private final CategoryRepository categories;

    public ConsultServiceSeeder(ServiceRepository services, CategoryRepository categories) {
        this.services = services;
        this.categories = categories;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (services.existsById(ID) || !categories.existsById("noi")) {
            return;
        }
        ServiceItem s = new ServiceItem();
        s.setId(ID);
        s.setCategoryId("noi");
        s.setName("Tư vấn cùng nhân viên");
        s.setDurationMin(30);
        s.setPrice(0L);
        s.setHot(false);
        s.setDescription("Trao đổi trực tiếp với nhân viên phòng khám để được hướng dẫn chọn dịch vụ, giấy tờ cần mang và quy trình khám. Miễn phí, không thay thế khám bệnh.");
        s.setIncludesText(String.join("\n",
                "Nhân viên giải đáp thắc mắc về dịch vụ và chi phí",
                "Hướng dẫn chọn chuyên khoa phù hợp",
                "Hoàn toàn miễn phí"));
        services.save(s);
        log.info("Đã tạo dịch vụ tư vấn miễn phí: {}", ID);
    }
}
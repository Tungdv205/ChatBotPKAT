package vn.anhthu.hengio.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import vn.anhthu.hengio.model.Category;
import vn.anhthu.hengio.model.ServiceItem;
import vn.anhthu.hengio.model.Staff;
import vn.anhthu.hengio.model.Voucher;
import vn.anhthu.hengio.repo.CategoryRepository;
import vn.anhthu.hengio.repo.ServiceRepository;
import vn.anhthu.hengio.repo.StaffRepository;
import vn.anhthu.hengio.repo.VoucherRepository;

/**
 * Nạp danh mục ban đầu (chuyên khoa, dịch vụ, bác sĩ, mã ưu đãi) từ file seed/catalog.json.
 * Chỉ chạy khi bảng còn trống, nên khởi động lại nhiều lần cũng không bị nạp trùng và không ghi đè chỉnh sửa của quản trị viên.
 */
@Component
@Order(1)
public class CatalogSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(CatalogSeeder.class);

    private final CategoryRepository categories;
    private final ServiceRepository services;
    private final StaffRepository staff;
    private final VoucherRepository vouchers;
    private final ObjectMapper mapper;

    public CatalogSeeder(CategoryRepository categories, ServiceRepository services, StaffRepository staff,
                         VoucherRepository vouchers, ObjectMapper mapper) {
        this.categories = categories;
        this.services = services;
        this.staff = staff;
        this.vouchers = vouchers;
        this.mapper = mapper;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (categories.count() > 0) {
            return;
        }
        JsonNode root;
        try (InputStream in = new ClassPathResource("seed/catalog.json").getInputStream()) {
            root = mapper.readTree(in);
        }
        for (JsonNode n : root.path("categories")) {
            Category c = new Category();
            c.setId(n.path("id").asText());
            c.setName(n.path("name").asText());
            c.setIcon(n.path("ic").asText(null));
            categories.save(c);
        }
        for (JsonNode n : root.path("services")) {
            ServiceItem s = new ServiceItem();
            s.setId(n.path("id").asText());
            s.setCategoryId(n.path("cat").asText());
            s.setName(n.path("name").asText());
            s.setDurationMin(n.path("dur").asInt());
            s.setPrice(n.path("price").asLong());
            s.setHot(n.path("hot").asInt(0) == 1);
            s.setDescription(n.path("desc").asText(""));
            List<String> inc = new ArrayList<>();
            for (JsonNode x : n.path("inc")) {
                inc.add(x.asText());
            }
            s.setIncludesText(String.join("\n", inc));
            services.save(s);
        }
        for (JsonNode n : root.path("staff")) {
            Staff st = new Staff();
            st.setId(n.path("id").asText());
            st.setName(n.path("name").asText());
            st.setRoleTitle(n.path("role").asText(""));
            List<String> cats = new ArrayList<>();
            for (JsonNode x : n.path("cats")) {
                cats.add(x.asText());
            }
            st.setCategories(String.join(",", cats));
            st.setRating(n.path("rating").asDouble());
            st.setExperienceYears(n.path("years").asInt());
            staff.save(st);
        }
        for (JsonNode n : root.path("vouchers")) {
            Voucher v = new Voucher();
            v.setCode(n.path("code").asText());
            v.setTitle(n.path("title").asText());
            v.setDiscountType(n.path("type").asText());
            v.setDiscountValue(n.path("val").asLong());
            v.setMaxDiscount(n.path("max").asLong());
            v.setMinOrder(n.path("min").asLong());
            v.setCategoryId(n.path("cat").asText(null));
            v.setNote(n.path("note").asText(""));
            vouchers.save(v);
        }
        log.info("Đã nạp danh mục: {} chuyên khoa, {} dịch vụ, {} nhân sự, {} mã ưu đãi",
                categories.count(), services.count(), staff.count(), vouchers.count());
    }
}
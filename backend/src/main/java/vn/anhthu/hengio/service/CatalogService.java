package vn.anhthu.hengio.service;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.anhthu.hengio.model.Category;
import vn.anhthu.hengio.model.ServiceItem;
import vn.anhthu.hengio.model.Staff;
import vn.anhthu.hengio.model.Voucher;
import vn.anhthu.hengio.repo.CategoryRepository;
import vn.anhthu.hengio.repo.ServiceRepository;
import vn.anhthu.hengio.repo.StaffRepository;
import vn.anhthu.hengio.repo.VoucherRepository;
import vn.anhthu.hengio.web.dto.CatalogDtos.CatalogRes;
import vn.anhthu.hengio.web.dto.CatalogDtos.CategoryDto;
import vn.anhthu.hengio.web.dto.CatalogDtos.ServiceDto;
import vn.anhthu.hengio.web.dto.CatalogDtos.StaffDto;
import vn.anhthu.hengio.web.dto.CatalogDtos.VoucherDto;

/** Đọc danh mục (chỉ các mục đang hoạt động) để giao diện hiển thị. */
@Service
public class CatalogService {
    private final CategoryRepository categories;
    private final ServiceRepository services;
    private final StaffRepository staff;
    private final VoucherRepository vouchers;

    public CatalogService(CategoryRepository categories, ServiceRepository services, StaffRepository staff,
                          VoucherRepository vouchers) {
        this.categories = categories;
        this.services = services;
        this.staff = staff;
        this.vouchers = vouchers;
    }

    @Transactional(readOnly = true)
    public CatalogRes catalog() {
        return new CatalogRes(
                categories.findAll().stream().map(CatalogService::toDto).toList(),
                services.findByActiveTrueOrderById().stream().map(CatalogService::toDto).toList(),
                staff.findByActiveTrueOrderById().stream().map(CatalogService::toDto).toList(),
                vouchers.findByActiveTrueOrderByCode().stream().map(CatalogService::toDto).toList());
    }

    static CategoryDto toDto(Category c) {
        return new CategoryDto(c.getId(), c.getName(), c.getIcon());
    }

    static ServiceDto toDto(ServiceItem s) {
        List<String> inc = s.getIncludesText() == null || s.getIncludesText().isBlank()
                ? List.of()
                : Arrays.asList(s.getIncludesText().split("\n"));
        return new ServiceDto(s.getId(), s.getCategoryId(), s.getName(), s.getDurationMin(), s.getPrice(), s.isHot(),
                s.getDescription(), inc);
    }

    static StaffDto toDto(Staff s) {
        List<String> cats = s.getCategories() == null || s.getCategories().isBlank()
                ? List.of()
                : Arrays.asList(s.getCategories().split(","));
        return new StaffDto(s.getId(), s.getName(), s.getRoleTitle(), cats, s.getRating(), s.getExperienceYears());
    }

    static VoucherDto toDto(Voucher v) {
        return new VoucherDto(v.getCode(), v.getTitle(), v.getDiscountType(), v.getDiscountValue(), v.getMaxDiscount(),
                v.getMinOrder(), v.getCategoryId(), v.getNote());
    }
}
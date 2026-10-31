package vn.anhthu.hengio.web.dto;

import java.util.List;

/** Dữ liệu danh mục trả cho giao diện. Tên trường khớp với dữ liệu giao diện React đang dùng (cat, dur, desc, inc...). */
public final class CatalogDtos {
    private CatalogDtos() {}

    public record CategoryDto(String id, String name, String ic) {}

    public record ServiceDto(String id, String cat, String name, int dur, long price, boolean hot, String desc, List<String> inc) {}

    public record StaffDto(String id, String name, String role, List<String> cats, double rating, int years) {}

    public record VoucherDto(String code, String title, String type, long val, long max, long min, String cat, String note) {}

    public record CatalogRes(List<CategoryDto> categories, List<ServiceDto> services, List<StaffDto> staff, List<VoucherDto> vouchers) {}
}
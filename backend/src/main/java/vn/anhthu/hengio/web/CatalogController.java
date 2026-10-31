package vn.anhthu.hengio.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.anhthu.hengio.service.CatalogService;
import vn.anhthu.hengio.web.dto.CatalogDtos.CatalogRes;

/** Danh mục công khai: ai cũng xem được, không cần đăng nhập. */
@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping
    public CatalogRes get() {
        return catalog.catalog();
    }
}
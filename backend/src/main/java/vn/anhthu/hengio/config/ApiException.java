package vn.anhthu.hengio.config;

/** Lỗi nghiệp vụ trả về cho giao diện dạng { "error": "..." } kèm mã HTTP. */
public class ApiException extends RuntimeException {
    private final int status;

    public ApiException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }

    public static ApiException bad(String msg) {
        return new ApiException(400, msg);
    }

    public static ApiException notFound(String msg) {
        return new ApiException(404, msg);
    }

    public static ApiException conflict(String msg) {
        return new ApiException(409, msg);
    }

    public static ApiException forbidden(String msg) {
        return new ApiException(403, msg);
    }
}
package vn.anhthu.hengio.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Yêu cầu hỗ trợ: khớp trường của React (id, topic, msg, ts, status, reply). */
public final class TicketDtos {
    private TicketDtos() {}

    public record TicketReq(@NotBlank @Size(max = 100) String topic, @NotBlank @Size(max = 800) String msg) {}

    public record TicketDto(String id, String topic, String msg, long ts, String status, String reply) {}
}
package vn.anhthu.hengio.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.anhthu.hengio.model.UserAccount;
import vn.anhthu.hengio.service.TicketService;
import vn.anhthu.hengio.web.dto.TicketDtos.TicketDto;
import vn.anhthu.hengio.web.dto.TicketDtos.TicketReq;

/** Yêu cầu hỗ trợ của người đang đăng nhập. */
@RestController
@RequestMapping("/api/tickets")
public class TicketController {
    private final TicketService tickets;

    public TicketController(TicketService tickets) {
        this.tickets = tickets;
    }

    @GetMapping
    public List<TicketDto> mine(@AuthenticationPrincipal UserAccount me) {
        return tickets.list(me.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketDto create(@AuthenticationPrincipal UserAccount me, @Valid @RequestBody TicketReq r) {
        return tickets.create(me.getId(), r);
    }
}
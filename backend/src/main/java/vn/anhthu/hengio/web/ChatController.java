package vn.anhthu.hengio.web;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import vn.anhthu.hengio.service.AiChatService;

/** Trợ lý AI. Công khai, có giới hạn theo IP. text = null nghĩa là AI chưa sẵn sàng, giao diện tự dùng câu trả lời có sẵn. */
@RestController
@RequestMapping("/api/chat")
public class ChatController {
    public record ChatReq(@NotBlank @Size(max = 500) String message) {}

    public record ChatRes(String text) {}

    private final AiChatService ai;

    public ChatController(AiChatService ai) {
        this.ai = ai;
    }

    @PostMapping
    public ChatRes chat(@Valid @RequestBody ChatReq r, HttpServletRequest req) {
        return new ChatRes(ai.answer(req.getRemoteAddr(), r.message().trim()));
    }
}
package vn.anhthu.hengio.web;

import java.util.List;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import vn.anhthu.hengio.service.AiChatService;
import vn.anhthu.hengio.service.AiChatService.Reply;

/**
 * Trợ lý AI. Công khai, có giới hạn theo IP.
 * text = null nghĩa là AI chưa sẵn sàng, giao diện tự dùng câu trả lời có sẵn.
 * suggestions: 3 câu hỏi gợi ý; needStaff: nên mời khách đặt lịch tư vấn với nhân viên.
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {
    public record ChatReq(@NotBlank @Size(max = 500) String message) {}

    public record ChatRes(String text, List<String> suggestions, boolean needStaff) {}

    private final AiChatService ai;

    public ChatController(AiChatService ai) {
        this.ai = ai;
    }

    @PostMapping
    public ChatRes chat(@Valid @RequestBody ChatReq r, HttpServletRequest req) {
        Reply reply = ai.reply(req.getRemoteAddr(), r.message().trim());
        if (reply == null) {
            return new ChatRes(null, List.of(), false);
        }
        return new ChatRes(reply.text(), reply.suggestions(), reply.needStaff());
    }
}
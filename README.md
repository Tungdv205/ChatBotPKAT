# Hẹn Giờ – Phòng khám đa khoa Anh Thu (React + Vite)

## Chạy thử

```bash
npm install
npm run dev
```

Mở địa chỉ hiện ra (thường là http://localhost:5173). Tài khoản dùng thử: `demo@henlich.vn` / `123456`.

## Cấu trúc

```
src/
  main.jsx                 điểm khởi động
  App.jsx                  chọn Đăng nhập hay khung ứng dụng, chuyển màn
  styles/global.css        toàn bộ CSS lấy từ bản demo (màu, font, dark mode)
  data/catalog.js          chuyên khoa, dịch vụ, bác sĩ, mã ưu đãi, câu hỏi thường gặp
  utils/helpers.js         ngày giờ, tiền, bỏ dấu tiếng Việt
  context/AuthContext.jsx  đăng nhập / đăng ký / quên mật khẩu (đang lưu localStorage)
  components/
    Icon.jsx               bộ biểu tượng
    Brand.jsx              Logo, Avatar
    Toast.jsx              thông báo nhỏ
    AppShell.jsx           thanh bên (máy tính), thanh trên + tab dưới (điện thoại)
    ChatWidget.jsx         nút chat kéo thả + khung chat + chatbot
  pages/
    Login.jsx              đăng nhập, đăng ký, quên mật khẩu
    Placeholder.jsx        màn tạm, sẽ thay bằng màn thật
```

## Chỗ nối với backend và AI sau này

- `context/AuthContext.jsx`: thay các hàm `login`, `register`, `resetPassword`, `logout` bằng lời gọi API.
- `components/ChatWidget.jsx`: thay hàm `botReply` bằng lời gọi dịch vụ chatbot AI.

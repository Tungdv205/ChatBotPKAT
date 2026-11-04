# Đặt lịch khám – Phòng khám đa khoa Anh Thu

Ứng dụng web đặt lịch khám trực tuyến: khách hàng chọn dịch vụ, bác sĩ, khung giờ và đặt lịch; quản trị viên xử lý lịch hẹn, hỗ trợ khách, quản lý dịch vụ, ưu đãi và nhân sự.

## Link demo

- Khách hàng: https://chat-bot-pkat.vercel.app
- Quản trị: https://chat-bot-pkat.vercel.app/admin
- API: https://hengio-api.onrender.com
- Tài khoản khách demo: `demo@henlich.vn` / `demo1234`
- Tài khoản quản trị: do người triển khai cấp (không công khai)

> Backend chạy trên gói miễn phí nên sẽ "ngủ" sau 15 phút không dùng. Lần mở đầu tiên có thể chờ 1–2 phút.

## Tính năng

**Khách hàng**
- Đăng ký, đăng nhập, quên và đổi mật khẩu
- Đặt lịch theo dịch vụ, bác sĩ, ngày và khung giờ còn trống
- Áp dụng mã ưu đãi, đổi hoặc hủy lịch (trước giờ hẹn ít nhất 2 giờ)
- Nhận thông báo (đặt lịch, hủy, hoàn thành), đánh giá dịch vụ sau khi khám
- Gửi yêu cầu hỗ trợ (ticket), khung chat trợ lý kéo thả được

**Quản trị (`/admin`)**
- Bảng điều khiển: lịch hôm nay, thống kê
- Lịch hẹn: hủy, đánh dấu đã khám (khách nhận thông báo)
- Ticket: trả lời khách
- Khách hàng (phân trang, có nhật ký kiểm toán khi xem), dịch vụ, ưu đãi, bác sĩ và nhân viên

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Front-end | React, Vite |
| Backend | Spring Boot 3.3.5, Java 17, Spring Security + JWT, JPA/Hibernate |
| Cơ sở dữ liệu | PostgreSQL (Neon) khi chạy thật; SQL Server khi chạy máy cá nhân |
| Triển khai | Vercel (front-end), Render + Docker (backend), Neon (database) |

## Cấu trúc thư mục

```
ChatBotFAQ/
├── src/                  mã nguồn front-end
│   ├── api/client.js     máy khách gọi API (token, xử lý lỗi, 401)
│   ├── admin/            giao diện và ngữ cảnh quản trị
│   └── ...               trang khách hàng, ChatWidget
├── index.html
├── vite.config.js        proxy /api → http://localhost:8080 khi chạy dev
├── package.json
└── backend/              Spring Boot API (xem backend/README.md)
    ├── Dockerfile
    ├── pom.xml
    └── src/main/...
```

## Chạy ở máy cá nhân

### 1. Backend

```powershell
cd backend
$env:DB_USER = "<tài khoản SQL Server>"
$env:DB_PASSWORD = "<mật khẩu>"
mvn spring-boot:run "-Dspring-boot.run.profiles=dev,sqlserver"
```

API chạy tại `http://localhost:8080`.

### 2. Front-end

```powershell
npm install
npm run dev
```

Mở `http://localhost:5173` (khách) và `http://localhost:5173/admin` (quản trị). Khi chạy dev, Vite chuyển `/api` sang backend nên không cần cấu hình thêm.

## Biến môi trường

**Front-end (Vercel)**

| Biến | Ý nghĩa |
|---|---|
| `VITE_API_URL` | Địa chỉ backend, ví dụ `https://hengio-api.onrender.com`. Đổi xong phải Redeploy. |

**Backend (Render)**

| Biến | Ý nghĩa |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `postgres` khi chạy thật |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Kết nối PostgreSQL (Neon) |
| `JWT_SECRET` | Khóa ký JWT |
| `JWT_EXPIRE_MINUTES` | Thời hạn token, mặc định 120 |
| `APP_ENC_KEY` | Khóa AES mã hóa dữ liệu cá nhân, **không đổi** sau khi đã có dữ liệu |
| `CORS_ORIGINS` | Địa chỉ front-end được phép gọi API |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Tài khoản admin khởi tạo (chỉ tạo khi chưa có) |
| `SEED_DEMO`, `DEMO_PASSWORD` | Tạo khách demo |
| `PORT` | Cổng chạy, mặc định 8080 |

## Tóm tắt API

- Công khai: `GET /api/catalog`, `POST /api/auth/*`
- Khách hàng (cần token): `/api/me`, `/api/appointments`, `/api/slots`, `/api/vouchers/check`, `/api/notifications`, `/api/tickets`
- Quản trị (token admin): `/api/admin/*`

Chi tiết nghiệp vụ, bảo mật và triển khai backend xem [backend/README.md](backend/README.md).

## Quy tắc nghiệp vụ

- Giờ làm việc 08:00–18:00, nghỉ trưa 12:00–13:30
- Đổi hoặc hủy lịch trước giờ hẹn ít nhất 2 giờ
- Sai mật khẩu 5 lần khóa tài khoản 15 phút; giới hạn 30 yêu cầu/phút/IP với `/api/auth/*`

## Triển khai

1. **Neon**: tạo project PostgreSQL, lấy chuỗi kết nối.
2. **Render**: Web Service, Root Directory `backend`, Language Docker, khai báo các biến môi trường ở trên. Tự deploy khi push lên `main`.
3. **Vercel**: import repo, đặt `VITE_API_URL` trỏ tới Render. Tự deploy khi push lên `main`.

## Lưu ý bảo mật

- Không commit mật khẩu, chuỗi kết nối, `JWT_SECRET`, `APP_ENC_KEY`.
- Sau khi demo xong: đổi mật khẩu Neon (cập nhật `DB_PASSWORD` trên Render), đặt `SEED_DEMO=false`, bỏ khung tài khoản demo ở trang đăng nhập.

## Hướng phát triển

- Tích hợp chatbot AI (khóa API đặt ở backend, giới hạn theo IP, chỉ trả lời dựa trên dữ liệu phòng khám, không chẩn đoán)
- Gửi email thật cho chức năng đặt lại mật khẩu
- Dùng migration (Flyway) thay cho `ddl-auto: update`
// Gọi backend. Mọi màn hình dùng hàm api() này, không tự gọi fetch.
// Đường dẫn: khi chạy thử (npm run dev), Vite chuyển /api sang http://localhost:8080 (xem vite.config.js).
// Khi đưa lên Vercel, đặt biến VITE_API_URL = địa chỉ backend thật, ví dụ https://api.ten-mien.vn
const BASE = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'hengio.token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch (e) {
    return null
  }
}

export function setToken(t) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else localStorage.removeItem(TOKEN_KEY)
  } catch (e) {
    /* bỏ qua */
  }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Khi token hết hạn hoặc bị vô hiệu (đổi mật khẩu ở nơi khác, bị khóa...), AuthContext đăng ký hàm này để đăng xuất
let onUnauthorized = null
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

// api('/api/me'), api('/api/auth/login', { method: 'POST', body: {...}, token: null })
// token: undefined = dùng token đã lưu, null = không gửi token (đăng nhập, đăng ký...)
export async function api(path, { method = 'GET', body, token } = {}) {
  const t = token === undefined ? getToken() : token
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (t) headers.Authorization = 'Bearer ' + t
  let res
  try {
    res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch (e) {
    throw new ApiError(0, 'Không kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại.')
  }
  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch (e) {
      data = null
    }
  }
  if (!res.ok) {
    if (res.status === 401 && t && onUnauthorized) onUnauthorized()
    throw new ApiError(res.status, (data && data.error) || 'Có lỗi xảy ra, vui lòng thử lại.')
  }
  return data
}
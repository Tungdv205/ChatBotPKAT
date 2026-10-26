// Hàm tiện ích dùng chung (ngày giờ, tiền, chuỗi)

export const pad = (n) => String(n).padStart(2, '0')
export const vnd = (n) => Number(n).toLocaleString('vi-VN') + 'đ'

export const dkey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
export const parseKey = (k) => {
  const p = k.split('-').map(Number)
  return new Date(p[0], p[1] - 1, p[2])
}
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

export const mins = (t) => {
  const p = t.split(':').map(Number)
  return p[0] * 60 + p[1]
}
export const tstr = (m) => pad(Math.floor(m / 60)) + ':' + pad(m % 60)

export const WD = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
export const WDS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
export const longDate = (k) => {
  const d = parseKey(k)
  return WD[d.getDay()] + ', ' + d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear()
}

// Bỏ dấu tiếng Việt, về chữ thường (dùng cho tìm kiếm và chatbot)
export const norm = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()

export const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const phoneRe = /^(0|\+84)\d{9}$/

// "5 phút trước", "2 ngày trước"... từ mốc thời gian (ms)
export const relTime = (ts) => {
  const s = (Date.now() - ts) / 1000
  if (s < 60) return 'Vừa xong'
  if (s < 3600) return Math.floor(s / 60) + ' phút trước'
  if (s < 86400) return Math.floor(s / 3600) + ' giờ trước'
  if (s < 7 * 86400) return Math.floor(s / 86400) + ' ngày trước'
  const d = new Date(ts)
  return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear()
}
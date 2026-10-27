// Luật đặt lịch: giờ làm việc, khung giờ trống, bác sĩ rảnh, mã ưu đãi.
// Các hàm nhận danh sách lịch hẹn của người dùng (appts) để kiểm tra trùng giờ.
import { STAFF, VOUCHERS } from '../data/catalog.js'
import { catById, eff, svcById } from './appointments.js'
import { addDays, dkey, mins, parseKey } from './helpers.js'

export const OPEN = 480 // 08:00
export const CLOSE = 1080 // 18:00
export const LUNCH = [720, 810] // nghỉ trưa 12:00 - 13:30

// Băm chuỗi thành số, dùng để giả lập lịch bận cố định của bác sĩ (bản dùng thử).
// Khi có backend, thay bằng dữ liệu lịch thật của bác sĩ.
function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Danh sách mã bác sĩ phụ trách chuyên khoa của dịch vụ
export const eligible = (svc) => {
  const cats = svc.cats || [svc.cat]
  const all = STAFF.filter((s) => cats.every((c) => s.cats.includes(c)))
  // Không có bác sĩ nào phụ trách đủ các chuyên khoa thì lấy bác sĩ phụ trách ít nhất một chuyên khoa
  return (all.length ? all : STAFF.filter((s) => cats.some((c) => s.cats.includes(c)))).map((s) => s.id)
}

export function staffBusy(appts, staffId, date, start, dur, exceptId) {
  for (let m = start; m < start + dur; m += 30) {
    if (hash(staffId + date + m) % 100 < 18) return true
  }
  return appts.some((a) => {
    if (a.id === exceptId || eff(a) === 'cancelled' || a.date !== date || a.staff !== staffId) return false
    const s = mins(a.time)
    const e = s + svcById(a.svc).dur
    return start < e && s < start + dur
  })
}

// Người dùng đã có lịch khác trùng giờ này chưa
export function userBusy(appts, date, start, dur, exceptId) {
  return appts.some((a) => {
    if (a.id === exceptId || a.status === 'cancelled' || a.date !== date) return false
    const s = mins(a.time)
    const e = s + svcById(a.svc).dur
    return start < e && s < start + dur
  })
}

// Trạng thái một khung giờ: 'ok' | 'closed' | 'past' | 'mine' | 'busy'
export function slotState(appts, svc, staffSel, date, m, exceptId) {
  const d = parseKey(date)
  if (d.getDay() === 0) return 'closed'
  const now = new Date()
  if (date === dkey(now) && m < now.getHours() * 60 + now.getMinutes() + 60) return 'past'
  if (userBusy(appts, date, m, svc.dur, exceptId)) return 'mine'
  const pool = staffSel === 'any' ? eligible(svc) : [staffSel]
  return pool.some((id) => !staffBusy(appts, id, date, m, svc.dur, exceptId)) ? 'ok' : 'busy'
}

// Chọn bác sĩ rảnh đầu tiên khi người dùng để "bất kỳ bác sĩ"
export function pickStaff(appts, svc, date, m, exceptId) {
  const pool = eligible(svc)
  for (let i = 0; i < pool.length; i++) {
    if (!staffBusy(appts, pool[i], date, m, svc.dur, exceptId)) return pool[i]
  }
  return null
}

// Các giờ bắt đầu hợp lệ trong ngày (không vượt giờ đóng cửa, không rơi vào nghỉ trưa)
export function slotsFor(svc) {
  const out = []
  for (let m = OPEN; m < CLOSE; m += 30) {
    if (m + svc.dur > CLOSE) continue
    if (m < LUNCH[1] && m + svc.dur > LUNCH[0]) continue
    out.push(m)
  }
  return out
}

// Trả về { d, v } nếu mã dùng được, hoặc { err } nếu không
export function calcDiscount(svc, code) {
  const v = VOUCHERS.find((x) => x.code === code)
  if (!v) return { err: 'Mã không tồn tại hoặc đã hết hạn.' }
   if (v.cat && !(svc.cats || [svc.cat]).includes(v.cat))
  if (svc.price < v.min) return { err: 'Mã này áp dụng cho đơn từ ' + v.min.toLocaleString('vi-VN') + 'đ.' }
  const d = v.type === 'pct' ? Math.min(Math.round((svc.price * v.val) / 100), v.max) : v.val
  return { d, v }
}

// Ngày gần nhất (trong 21 ngày tới) còn ít nhất một giờ trống
export function firstOpenDate(appts, svc, staffSel, exceptId) {
  const slots = slotsFor(svc)
  for (let i = 0; i < 21; i++) {
    const k = dkey(addDays(new Date(), i))
    if (slots.some((m) => slotState(appts, svc, staffSel, k, m, exceptId) === 'ok')) return k
  }
  return dkey(new Date())
}

// Mã lịch hẹn mới dạng HG-1234, không trùng mã đã có
export function newApptId(appts) {
  let id
  do {
    id = 'HG-' + (1000 + Math.floor(Math.random() * 9000))
  } while (appts.some((a) => a.id === id))
  return id
}

// Tiền giảm và tổng thanh toán cho lần đặt hiện tại.
// Khi đang đổi lịch thì giữ nguyên mã và số tiền của lịch cũ.
export function currentTotals(appts, b, svc) {
  const old = b.editId ? appts.find((x) => x.id === b.editId) : null
  if (old) return { d: old.discount || 0, code: old.code || '', total: old.total }
  if (b.code) {
    const r = calcDiscount(svc, b.code)
    if (!r.err) return { d: r.d, code: b.code, total: svc.price - r.d }
  }
  return { d: 0, code: '', total: svc.price }
}
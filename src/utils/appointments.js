// Hàm dùng chung cho lịch hẹn và tra cứu dữ liệu danh mục
import { CATS, SERVICES, STAFF } from '../data/catalog.js'
import { mins, parseKey } from './helpers.js'

// Một lịch có thể gồm nhiều dịch vụ: mã dạng 's1+s12'. Khi đó trả về một "dịch vụ gộp" (cộng thời lượng, cộng giá)
export const svcById = (id) => {
  if (!id) return undefined
  if (!String(id).includes('+')) return SERVICES.find((s) => s.id === id)
  const items = String(id)
    .split('+')
    .map((i) => SERVICES.find((s) => s.id === i))
    .filter(Boolean)
  if (!items.length) return undefined
  return {
    id,
    name: items.map((s) => s.name).join(' + '),
    cat: items[0].cat,
    cats: [...new Set(items.map((s) => s.cat))],
    dur: items.reduce((n, s) => n + s.dur, 0),
    price: items.reduce((n, s) => n + s.price, 0),
    count: items.length,
    items,
    desc: items.map((s) => s.name).join(', '),
    inc: items.flatMap((s) => s.inc || []),
  }
}
export const staffById = (id) => STAFF.find((s) => s.id === id)
export const catById = (id) => CATS.find((c) => c.id === id)

export function startOf(a) {
  const d = parseKey(a.date)
  d.setMinutes(mins(a.time))
  return d
}
export function endOf(a) {
  const d = parseKey(a.date)
  d.setMinutes(mins(a.time) + svcById(a.svc).dur)
  return d
}

// Trạng thái hiệu lực: lịch "upcoming" đã qua giờ kết thúc thì tính là "done"
export function eff(a) {
  return a.status === 'upcoming' && endOf(a) < new Date() ? 'done' : a.status
}

export const upcomingList = (appts) =>
  appts.filter((a) => eff(a) === 'upcoming').sort((a, b) => startOf(a) - startOf(b))

// Chỉ đổi/hủy được khi còn ít nhất 2 giờ trước giờ hẹn
export const canChange = (a) => startOf(a) - new Date() >= 2 * 3600000
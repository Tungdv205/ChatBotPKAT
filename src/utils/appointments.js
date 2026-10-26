// Hàm dùng chung cho lịch hẹn và tra cứu dữ liệu danh mục
import { CATS, SERVICES, STAFF } from '../data/catalog.js'
import { mins, parseKey } from './helpers.js'

export const svcById = (id) => SERVICES.find((s) => s.id === id)
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
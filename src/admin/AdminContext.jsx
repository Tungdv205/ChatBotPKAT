import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { KEY as CUSTOMER_KEY, loadDb } from '../context/AuthContext.jsx'
import { CATS, SERVICES, STAFF, VOUCHERS } from '../data/catalog.js'

// BẢN DÙNG THỬ: quản trị viên, dữ liệu khách và danh mục (dịch vụ, ưu đãi, bác sĩ)
// đều lưu trong localStorage của trình duyệt.
// Khi có backend, thay các hàm login/logout/saveCustomers/saveCatalog bằng lời gọi API;
// các màn quản trị không phải sửa.

const ADMIN_KEY = 'hengio.admin.v1'
const CATALOG_KEY = 'hengio.admin.catalog.v1'
const ADMIN = { email: 'admin@henlich.vn', pass: 'admin123', name: 'Quản trị viên' }

const AdminContext = createContext(null)
export const useAdmin = () => useContext(AdminContext)

function loadSession() {
  try {
    return localStorage.getItem(ADMIN_KEY) === '1'
  } catch (e) {
    return false
  }
}

function loadCatalog() {
  try {
    const raw = localStorage.getItem(CATALOG_KEY)
    if (raw) {
      const o = JSON.parse(raw)
      if (o && o.services && o.vouchers && o.staff) return o
    }
  } catch (e) {
    /* bỏ qua */
  }
  return {
    services: SERVICES.map((s) => ({ ...s })),
    vouchers: VOUCHERS.map((v) => ({ ...v })),
    staff: STAFF.map((s) => ({ ...s })),
  }
}

const mkNotif = (n) => ({
  id: 'n' + Date.now() + Math.floor(Math.random() * 999),
  t: n.t || 'system',
  title: n.title,
  body: n.body,
  ts: Date.now(),
  read: false,
})

export function AdminProvider({ children }) {
  const [signed, setSigned] = useState(loadSession)
  const [db, setDb] = useState(loadDb) // dữ liệu khách: { users: { email: {...} } }
  const [catalog, setCatalog] = useState(loadCatalog) // { services, vouchers, staff }

  // Đọc lại dữ liệu khách khi quay lại tab (khách vừa đặt lịch ở tab khác)
  const reload = useCallback(() => setDb(loadDb()), [])
  useEffect(() => {
    window.addEventListener('focus', reload)
    window.addEventListener('storage', reload)
    return () => {
      window.removeEventListener('focus', reload)
      window.removeEventListener('storage', reload)
    }
  }, [reload])

  useEffect(() => {
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog))
    } catch (e) {
      /* bỏ qua */
    }
  }, [catalog])

  const login = useCallback((email, pass) => {
    if (email !== ADMIN.email || pass !== ADMIN.pass) return { ok: false, error: 'Email hoặc mật khẩu quản trị chưa đúng.' }
    try {
      localStorage.setItem(ADMIN_KEY, '1')
    } catch (e) {
      /* bỏ qua */
    }
    setSigned(true)
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(ADMIN_KEY)
    } catch (e) {
      /* bỏ qua */
    }
    setSigned(false)
  }, [])

  // Sửa dữ liệu khách rồi lưu lại cho app khách đọc
  const saveCustomers = useCallback((fn) => {
    setDb((cur) => {
      const next = fn(cur)
      try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(next))
      } catch (e) {
        /* bỏ qua */
      }
      return next
    })
  }, [])

  // Sửa một lịch hẹn của một khách, có thể kèm thông báo gửi cho khách
  const updateAppt = useCallback(
    (email, id, patch, notif) => {
      saveCustomers((cur) => {
        const u = cur.users[email]
        if (!u) return cur
        const next = {
          ...u,
          appts: u.appts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
          notifs: notif ? [mkNotif({ ...notif, t: 'booking' }), ...u.notifs] : u.notifs,
        }
        return { ...cur, users: { ...cur.users, [email]: next } }
      })
    },
    [saveCustomers]
  )

  // Trả lời / đổi trạng thái một yêu cầu hỗ trợ của một khách
  const updateTicket = useCallback(
    (email, id, patch, notif) => {
      saveCustomers((cur) => {
        const u = cur.users[email]
        if (!u) return cur
        const next = {
          ...u,
          tickets: (u.tickets || []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
          notifs: notif ? [mkNotif({ ...notif, t: 'system' }), ...u.notifs] : u.notifs,
        }
        return { ...cur, users: { ...cur.users, [email]: next } }
      })
    },
    [saveCustomers]
  )

  // Sửa danh mục: fn nhận { services, vouchers, staff } và trả về bản mới
  const saveCatalog = useCallback((fn) => setCatalog((cur) => fn(cur)), [])

  const value = useMemo(() => {
    const customers = Object.values(db.users)
    // Tất cả lịch hẹn của mọi khách, kèm thông tin người đặt
    const appts = customers.flatMap((u) =>
      u.appts.map((a) => ({ ...a, user: { name: u.name, email: u.email, phone: u.phone } }))
    )
    // Tất cả yêu cầu hỗ trợ, kèm thông tin người gửi
    const tickets = customers.flatMap((u) =>
      (u.tickets || []).map((t) => ({ ...t, user: { name: u.name, email: u.email, phone: u.phone } }))
    )
    return {
      admin: signed ? ADMIN : null,
      login,
      logout,
      customers,
      appts,
      tickets,
      cats: CATS,
      services: catalog.services,
      vouchers: catalog.vouchers,
      staff: catalog.staff,
      svcOf: (id) => catalog.services.find((s) => s.id === id),
      staffOf: (id) => catalog.staff.find((s) => s.id === id),
      catOf: (id) => CATS.find((c) => c.id === id),
      saveCustomers,
      updateAppt,
      updateTicket,
      saveCatalog,
      reload,
    }
  }, [signed, db, catalog, login, logout, saveCustomers, updateAppt, updateTicket, saveCatalog, reload])

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}
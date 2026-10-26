import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { KEY as CUSTOMER_KEY, loadDb } from '../context/AuthContext.jsx'

// BẢN DÙNG THỬ: quản trị viên và dữ liệu khách đều lấy từ localStorage của trình duyệt.
// Khi có backend, thay các hàm login/logout/saveCustomers bằng lời gọi API;
// các màn quản trị không phải sửa.

const ADMIN_KEY = 'hengio.admin.v1'
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

export function AdminProvider({ children }) {
  const [signed, setSigned] = useState(loadSession)
  const [db, setDb] = useState(loadDb) // dữ liệu khách: { users: { email: {...} } }

  // Đọc lại dữ liệu khi quay lại tab (khách vừa đặt lịch ở tab khác)
  const reload = useCallback(() => setDb(loadDb()), [])
  useEffect(() => {
    window.addEventListener('focus', reload)
    window.addEventListener('storage', reload)
    return () => {
      window.removeEventListener('focus', reload)
      window.removeEventListener('storage', reload)
    }
  }, [reload])

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

  // Sửa dữ liệu khách (đổi trạng thái lịch, trả lời yêu cầu...) rồi lưu lại cho app khách đọc
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

  const value = useMemo(() => {
    const customers = Object.values(db.users)
    // Tất cả lịch hẹn của mọi khách, kèm thông tin người đặt
    const appts = customers.flatMap((u) =>
      u.appts.map((a) => ({ ...a, user: { name: u.name, email: u.email, phone: u.phone } }))
    )
    return { admin: signed ? ADMIN : null, login, logout, customers, appts, saveCustomers, reload }
  }, [signed, db, login, logout, saveCustomers, reload])

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}
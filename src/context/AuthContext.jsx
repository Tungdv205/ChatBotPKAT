import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, getToken, setToken, setUnauthorizedHandler } from '../api/client.js'

// Tài khoản nay nằm trên backend (SQL Server). Trình duyệt chỉ giữ token đăng nhập.
// Hai dòng dưới giữ lại cho trang quản trị cũ, sẽ bỏ khi trang quản trị nối backend.
export { KEY, loadDb } from './LegacyAuth.jsx'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// Dữ liệu người dùng từ backend. notifs và tickets nạp từ backend sau khi đăng nhập;
// appts tạm để rỗng, các màn đặt lịch vẫn chạy với dữ liệu tạm trong bộ nhớ (sẽ nối ở bước sau).
const toUser = (d) => ({
  ...d,
  phone: d.phone || '',
  dob: d.dob || '',
  gender: d.gender || '',
  appts: [],
  notifs: [],
  tickets: [],
})

// Giữ lại dữ liệu tạm khi chỉ cập nhật hồ sơ
const keepExtras = (u, d) => ({ ...toUser(d), appts: u.appts, notifs: u.notifs, tickets: u.tickets })

const fail = (e) => ({ ok: false, error: e.message || 'Có lỗi xảy ra, vui lòng thử lại.' })

export function AuthProvider({ children }) {
  const [token, setTok] = useState(getToken)
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(!!getToken()) // đang kiểm tra token đã lưu
  const userRef = useRef(null)

  useEffect(() => {
    userRef.current = user
  }, [user])

  // Mở lại trang: nếu còn token thì hỏi backend xem token còn dùng được không
  useEffect(() => {
    if (!token) {
      setBooting(false)
      return undefined
    }
    if (userRef.current) return undefined // vừa đăng nhập xong, đã có dữ liệu
    let off = false
    api('/api/me')
      .then((d) => {
        if (!off) setUser(toUser(d))
      })
      .catch(() => {
        if (!off) {
          setToken(null)
          setTok(null)
        }
      })
      .finally(() => {
        if (!off) setBooting(false)
      })
    return () => {
      off = true
    }
  }, [token])

  // Nạp thông báo và yêu cầu hỗ trợ từ backend (lịch hẹn sẽ nạp ở bước sau)
  const refreshExtras = useCallback(async () => {
    try {
      const [notifs, tickets] = await Promise.all([api('/api/notifications'), api('/api/tickets')])
      setUser((u) => (u ? { ...u, notifs, tickets } : u))
    } catch (e) {
      /* lỗi mạng thì giữ dữ liệu cũ */
    }
  }, [])

  // Khi đã đăng nhập: nạp ngay, rồi cứ 60 giây nạp lại để thấy thông báo và phản hồi mới
  const uid = user ? user.id : null
  useEffect(() => {
    if (!uid) return undefined
    refreshExtras()
    const timer = setInterval(refreshExtras, 60000)
    return () => clearInterval(timer)
  }, [uid, refreshExtras])

  const signOut = useCallback(() => {
    setToken(null)
    setTok(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(signOut)
    return () => setUnauthorizedHandler(null)
  }, [signOut])

  const start = (res) => {
    setToken(res.token)
    setUser(toUser(res.user))
    setTok(res.token)
  }

  // Mỗi hàm trả về Promise { ok: true } hoặc { ok: false, error: '...' }
  const login = useCallback(async (email, pass) => {
    try {
      const res = await api('/api/auth/login', { method: 'POST', body: { email, password: pass }, token: null })
      if (res.user.role === 'ADMIN') return { ok: false, error: 'Tài khoản quản trị vui lòng đăng nhập ở trang /admin.' }
      start(res)
      return { ok: true }
    } catch (e) {
      return fail(e)
    }
  }, [])

  const register = useCallback(async ({ name, email, phone, pass }) => {
    try {
      const res = await api('/api/auth/register', { method: 'POST', body: { name, email, phone, password: pass }, token: null })
      start(res)
      return { ok: true }
    } catch (e) {
      return fail(e)
    }
  }, [])

  // Quên mật khẩu: backend luôn trả lời giống nhau dù email có tài khoản hay không
  const requestReset = useCallback(async (email) => {
    try {
      await api('/api/auth/forgot', { method: 'POST', body: { email }, token: null })
      return { ok: true }
    } catch (e) {
      return fail(e)
    }
  }, [])

  const resetPassword = useCallback(async (resetToken, pass) => {
    try {
      await api('/api/auth/reset', { method: 'POST', body: { token: resetToken, password: pass }, token: null })
      return { ok: true }
    } catch (e) {
      return fail(e)
    }
  }, [])

  const logout = signOut

  // Lưu hồ sơ lên backend. patch có thể gồm name, phone, dob, gender, settings: { remind, promo }
  const saveProfile = useCallback(
    async (patch) => {
      const cur = userRef.current
      if (!cur) return { ok: false, error: 'Phiên đăng nhập đã hết.' }
      const st = { ...cur.settings, ...(patch.settings || {}) }
      try {
        const d = await api('/api/me', {
          method: 'PUT',
          body: {
            name: patch.name ?? cur.name,
            phone: patch.phone ?? cur.phone,
            dob: patch.dob ?? cur.dob,
            gender: patch.gender ?? cur.gender,
            remind: st.remind,
            promo: st.promo,
          },
        })
        setUser((u) => (u ? keepExtras(u, d) : u))
        return { ok: true }
      } catch (e) {
        return fail(e)
      }
    },
    []
  )

  // Đổi mật khẩu: backend cấp token mới để người dùng không bị đăng xuất
  const changePassword = useCallback(async (current, pass) => {
    try {
      const res = await api('/api/me/password', { method: 'PUT', body: { current, password: pass } })
      setToken(res.token)
      setTok(res.token)
      return { ok: true }
    } catch (e) {
      return fail(e)
    }
  }, [])

  // Xóa tài khoản và toàn bộ dữ liệu: phải nhập lại mật khẩu
  const deleteAccount = useCallback(
    async (pass) => {
      try {
        await api('/api/me', { method: 'DELETE', body: { password: pass } })
        signOut()
        return { ok: true }
      } catch (e) {
        return fail(e)
      }
    },
    [signOut]
  )

  // Đánh dấu đã đọc: cập nhật giao diện ngay, rồi báo backend
  const markRead = useCallback(async (id) => {
    setUser((u) => (u ? { ...u, notifs: u.notifs.map((n) => (n.id === id ? { ...n, read: true } : n)) } : u))
    try {
      await api('/api/notifications/' + id + '/read', { method: 'POST' })
    } catch (e) {
      /* bỏ qua */
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setUser((u) => (u ? { ...u, notifs: u.notifs.map((n) => ({ ...n, read: true })) } : u))
    try {
      await api('/api/notifications/read-all', { method: 'POST' })
    } catch (e) {
      /* bỏ qua */
    }
  }, [])

  // Gửi yêu cầu hỗ trợ. Backend trả về yêu cầu vừa tạo và tự tạo một thông báo "Đã nhận yêu cầu"
  const addTicket = useCallback(
    async (topic, msg) => {
      try {
        const t = await api('/api/tickets', { method: 'POST', body: { topic, msg } })
        setUser((u) => (u ? { ...u, tickets: [t, ...u.tickets] } : u))
        refreshExtras()
        return { ok: true, ticket: t }
      } catch (e) {
        return fail(e)
      }
    },
    [refreshExtras]
  )

  // Tạm thời: các màn Đặt lịch và Lịch hẹn vẫn sửa dữ liệu trong bộ nhớ.
  // Sẽ được nối backend ở bước sau, hàm này sẽ bị bỏ.
  const updateUser = useCallback((fn) => {
    setUser((u) => (u ? fn(u) : u))
  }, [])

  const value = useMemo(
    () => ({
      user,
      booting,
      login,
      register,
      requestReset,
      resetPassword,
      logout,
      saveProfile,
      changePassword,
      deleteAccount,
      markRead,
      markAllRead,
      addTicket,
      updateUser,
    }),
    [
      user,
      booting,
      login,
      register,
      requestReset,
      resetPassword,
      logout,
      saveProfile,
      changePassword,
      deleteAccount,
      markRead,
      markAllRead,
      addTicket,
      updateUser,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
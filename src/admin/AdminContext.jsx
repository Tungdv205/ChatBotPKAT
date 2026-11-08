import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, setUnauthorizedHandler } from '../api/client.js'
import { CATS } from '../data/catalog.js'

// Trang quản trị dùng backend thật: đăng nhập bằng tài khoản quản trị, mọi dữ liệu lấy từ /api/admin/**.
// Token quản trị lưu riêng (hengio.admin.token) để không lẫn với token của khách.

const TOKEN_KEY = 'hengio.admin.token'
const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch (e) {
    return null
  }
}
const writeToken = (t) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else localStorage.removeItem(TOKEN_KEY)
  } catch (e) {
    /* bỏ qua */
  }
}

const AdminContext = createContext(null)
export const useAdmin = () => useContext(AdminContext)

const fail = (e) => ({ ok: false, status: e.status, error: e.message || 'Có lỗi xảy ra, vui lòng thử lại.' })

// Đưa dữ liệu backend về dạng các màn quản trị đang dùng
const toAppt = (a) => ({ ...a, user: { id: a.userId, name: a.customer, phone: a.phone, email: '' } })
const toTicket = (t) => ({ ...t, user: { id: t.userId, name: t.customer, phone: t.phone, email: '' } })
const withOff = (x) => ({ ...x, off: !x.active })

export function AdminProvider({ children }) {
  const [token, setTok] = useState(readToken)
  const [admin, setAdmin] = useState(null)
  const [booting, setBooting] = useState(!!readToken())
  const [appts, setAppts] = useState([])
  const [tickets, setTickets] = useState([])
  const [services, setServices] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [staff, setStaff] = useState([])
  const [stats, setStats] = useState(null)
  const tokenRef = useRef(token)
  tokenRef.current = token

  // Gọi API quản trị kèm token quản trị
  const adm = useCallback((path, opts) => api(path, { ...(opts || {}), token: tokenRef.current }), [])

  const signOut = useCallback(() => {
    writeToken(null)
    tokenRef.current = null
    setTok(null)
    setAdmin(null)
    setAppts([])
    setTickets([])
    setStats(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(signOut)
    return () => setUnauthorizedHandler(null)
  }, [signOut])

  // Mở lại trang: còn token thì kiểm tra token còn dùng được và đúng là quản trị
  useEffect(() => {
    if (!token) {
      setBooting(false)
      return undefined
    }
    if (admin) return undefined
    let off = false
    api('/api/me', { token })
      .then((u) => {
        if (off) return
        if (u.role === 'ADMIN') setAdmin(u)
        else signOut()
      })
      .catch(() => !off && signOut())
      .finally(() => !off && setBooting(false))
    return () => {
      off = true
    }
  }, [token])

  // ----- Nạp dữ liệu -----
  const refreshAppts = useCallback(async () => {
    try {
      setAppts((await adm('/api/admin/appointments')).map(toAppt))
    } catch (e) {
      /* giữ dữ liệu cũ */
    }
  }, [adm])
  const refreshTickets = useCallback(async () => {
    try {
      setTickets((await adm('/api/admin/tickets?status=all')).map(toTicket))
    } catch (e) {
      /* giữ dữ liệu cũ */
    }
  }, [adm])
  const refreshStats = useCallback(async () => {
    try {
      setStats(await adm('/api/admin/stats'))
    } catch (e) {
      /* giữ dữ liệu cũ */
    }
  }, [adm])
  const refreshCatalog = useCallback(async () => {
    try {
      const [s, v, st] = await Promise.all([
        adm('/api/admin/services'),
        adm('/api/admin/vouchers'),
        adm('/api/admin/staff'),
      ])
      setServices(s.map(withOff))
      setVouchers(v.map(withOff))
      setStaff(st.map(withOff))
    } catch (e) {
      /* giữ dữ liệu cũ */
    }
  }, [adm])

  const reload = useCallback(() => {
    refreshAppts()
    refreshTickets()
    refreshStats()
    refreshCatalog()
  }, [refreshAppts, refreshTickets, refreshStats, refreshCatalog])

  // Đăng nhập xong thì nạp ngay, sau đó nạp lại mỗi 60 giây và khi quay lại tab
  const aid = admin ? admin.id : null
  useEffect(() => {
    if (!aid) return undefined
    reload()
    const timer = setInterval(reload, 60000)
    window.addEventListener('focus', reload)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', reload)
    }
  }, [aid, reload])

  // ----- Đăng nhập, đăng xuất -----
  const login = useCallback(async (email, pass) => {
    try {
      const res = await api('/api/auth/login', { method: 'POST', body: { email, password: pass }, token: null })
      if (res.user.role !== 'ADMIN') return { ok: false, error: 'Tài khoản này không có quyền quản trị.' }
      writeToken(res.token)
      tokenRef.current = res.token
      setAdmin(res.user)
      setTok(res.token)
      return { ok: true }
    } catch (e) {
      return fail(e)
    }
  }, [])

  // ----- Lịch hẹn -----
  const cancelAppt = useCallback(
    async (id, reason) => {
      try {
        await adm('/api/admin/appointments/' + id + '/cancel', { method: 'POST', body: { reason } })
        await Promise.all([refreshAppts(), refreshStats()])
        return { ok: true }
      } catch (e) {
        return fail(e)
      }
    },
    [adm, refreshAppts, refreshStats]
  )

  const doneAppt = useCallback(
    async (id) => {
      try {
        await adm('/api/admin/appointments/' + id + '/done', { method: 'POST' })
        await Promise.all([refreshAppts(), refreshStats()])
        return { ok: true }
      } catch (e) {
        return fail(e)
      }
    },
    [adm, refreshAppts, refreshStats]
  )
  const deleteAppt = useCallback(
    async (id) => {
      try {
        await adm('/api/admin/appointments/' + id, { method: 'DELETE' })
        await Promise.all([refreshAppts(), refreshStats()])
        return { ok: true }
      } catch (e) {
        return fail(e)
      }
    },
    [adm, refreshAppts, refreshStats]
  )

  // ----- Yêu cầu hỗ trợ -----
  const replyTicket = useCallback(
    async (id, reply) => {
      try {
        await adm('/api/admin/tickets/' + id + '/reply', { method: 'POST', body: { reply } })
        await Promise.all([refreshTickets(), refreshStats()])
        return { ok: true }
      } catch (e) {
        return fail(e)
      }
    },
    [adm, refreshTickets, refreshStats]
  )

  // ----- Danh mục: dịch vụ, mã ưu đãi, nhân sự (id/code rỗng nghĩa là thêm mới) -----
  const saveService = useCallback(
    async (id, body) => {
      try {
        const r = id
          ? await adm('/api/admin/services/' + id, { method: 'PUT', body })
          : await adm('/api/admin/services', { method: 'POST', body })
        await refreshCatalog()
        return { ok: true, item: r }
      } catch (e) {
        return fail(e)
      }
    },
    [adm, refreshCatalog]
  )

  const saveVoucher = useCallback(
    async (code, body) => {
      try {
        const r = code
          ? await adm('/api/admin/vouchers/' + encodeURIComponent(code), { method: 'PUT', body })
          : await adm('/api/admin/vouchers', { method: 'POST', body })
        await refreshCatalog()
        return { ok: true, item: r }
      } catch (e) {
        return fail(e)
      }
    },
    [adm, refreshCatalog]
  )

  const removeVoucher = useCallback(
    async (code) => {
      try {
        await adm('/api/admin/vouchers/' + encodeURIComponent(code), { method: 'DELETE' })
        await refreshCatalog()
        return { ok: true }
      } catch (e) {
        return fail(e)
      }
    },
    [adm, refreshCatalog]
  )

  const saveStaff = useCallback(
    async (id, body) => {
      try {
        const r = id
          ? await adm('/api/admin/staff/' + id, { method: 'PUT', body })
          : await adm('/api/admin/staff', { method: 'POST', body })
        await refreshCatalog()
        return { ok: true, item: r }
      } catch (e) {
        return fail(e)
      }
    },
    [adm, refreshCatalog]
  )

  // ----- Khách hàng (màn Khách hàng gọi trực tiếp vì có phân trang) -----
  const value = useMemo(
    () => ({
      admin,
      booting,
      login,
      logout: signOut,
      adm,
      appts,
      tickets,
      stats,
      cats: CATS,
      services,
      vouchers,
      staff,
      svcOf: (id) => services.find((s) => s.id === id),
      staffOf: (id) => staff.find((s) => s.id === id),
      catOf: (id) => CATS.find((c) => c.id === id),
      cancelAppt,
      doneAppt,
      deleteAppt,
      replyTicket,
      saveService,
      saveVoucher,
      removeVoucher,
      saveStaff,
      reload,
    }),
    [
      admin,
      booting,
      login,
      signOut,
      adm,
      appts,
      tickets,
      stats,
      services,
      vouchers,
      staff,
      cancelAppt,
      doneAppt,
      deleteAppt,
      replyTicket,
      saveService,
      saveVoucher,
      removeVoucher,
      saveStaff,
      reload,
    ]
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}
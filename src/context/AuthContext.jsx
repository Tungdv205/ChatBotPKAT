import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { addDays, dkey } from '../utils/helpers.js'

// BẢN DÙNG THỬ: tài khoản lưu trong localStorage của trình duyệt.
// Khi có backend, chỉ cần thay các hàm login/register/resetPassword/logout
// bên dưới bằng lời gọi API; các màn hình không phải sửa.

const KEY = 'hengio.demo.v2'

function seedDemo(db) {
  if (db.users['demo@henlich.vn']) return db
  const now = new Date()
  let up = addDays(now, 2)
  if (up.getDay() === 0) up = addDays(up, 1)
  const day = 86400000
  db.users['demo@henlich.vn'] = {
    name: 'Nguyễn Thanh Mai',
    email: 'demo@henlich.vn',
    phone: '0912345678',
    pass: '123456',
    dob: '1995-04-12',
    gender: 'Nữ',
    settings: { remind: true, promo: true },
    appts: [
      { id: 'HG-2417', svc: 's12', staff: 'st7', date: dkey(up), time: '08:30', note: 'Đã nhịn ăn từ 22:00 tối hôm trước.', code: 'XN15', discount: 52500, total: 297500, status: 'upcoming', created: Date.now() - day },
      { id: 'HG-1803', svc: 's6', staff: 'st4', date: dkey(addDays(now, -9)), time: '14:00', note: '', code: '', discount: 0, total: 200000, status: 'upcoming', created: Date.now() - 12 * day },
      { id: 'HG-1655', svc: 's10', staff: 'st6', date: dkey(addDays(now, -3)), time: '10:00', note: '', code: '', discount: 0, total: 100000, status: 'cancelled', created: Date.now() - 8 * day },
    ],
    notifs: [
      { id: 'n1', t: 'booking', title: 'Đặt lịch thành công', body: 'Xét nghiệm máu tổng quát, mã HG-2417.', ts: Date.now() - day, read: false },
      { id: 'n2', t: 'promo', title: 'Ưu đãi tháng này', body: 'Dùng mã XN15 giảm 15% cho xét nghiệm và chẩn đoán hình ảnh.', ts: Date.now() - 2 * day, read: false },
      { id: 'n3', t: 'system', title: 'Chào mừng đến Phòng khám đa khoa Anh Thu', body: 'Đặt lịch khám, xét nghiệm và nhận nhắc lịch trong vài bước.', ts: Date.now() - 12 * day, read: true },
    ],
  }
  return db
}

function loadDb() {
  let db = { users: {}, session: null }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const o = JSON.parse(raw)
      if (o && o.users) db = o
    }
  } catch (e) {
    /* bỏ qua */
  }
  return seedDemo(db)
}

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [db, setDb] = useState(loadDb)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db))
    } catch (e) {
      /* bỏ qua */
    }
  }, [db])

  const user = db.session ? db.users[db.session] || null : null

  // Mỗi hàm trả về { ok: true } hoặc { ok: false, error: '...' }
  const login = useCallback(
    (email, pass) => {
      const u = db.users[email]
      if (!u || u.pass !== pass) return { ok: false, error: 'Email hoặc mật khẩu chưa đúng.' }
      setDb((d) => ({ ...d, session: email }))
      return { ok: true }
    },
    [db.users]
  )

  const register = useCallback(
    ({ name, email, phone, pass }) => {
      if (db.users[email]) return { ok: false, error: 'Email này đã có tài khoản. Hãy đăng nhập.' }
      const now = Date.now()
      const u = {
        name,
        email,
        phone,
        pass,
        dob: '',
        gender: '',
        settings: { remind: true, promo: true },
        appts: [],
        notifs: [
          { id: 'n' + now, t: 'system', title: 'Chào mừng đến Phòng khám đa khoa Anh Thu', body: 'Tài khoản của bạn đã sẵn sàng. Bấm Đặt lịch để chọn dịch vụ và bác sĩ.', ts: now, read: false },
          { id: 'n' + (now + 1), t: 'promo', title: 'Quà chào bạn mới', body: 'Dùng mã CHAOBAN giảm 30.000đ cho lịch hẹn từ 150.000đ.', ts: now, read: false },
        ],
      }
      setDb((d) => ({ users: { ...d.users, [email]: u }, session: email }))
      return { ok: true }
    },
    [db.users]
  )

  const resetPassword = useCallback(
    (email, pass) => {
      if (!db.users[email]) return { ok: false, error: 'Không tìm thấy tài khoản với email này.' }
      setDb((d) => ({ ...d, users: { ...d.users, [email]: { ...d.users[email], pass } } }))
      return { ok: true }
    },
    [db.users]
  )

  const logout = useCallback(() => setDb((d) => ({ ...d, session: null })), [])

  // Cập nhật dữ liệu của người dùng đang đăng nhập (dùng cho các màn sau: hồ sơ, đặt lịch, thông báo)
  const updateUser = useCallback((fn) => {
    setDb((d) => {
      if (!d.session) return d
      const cur = d.users[d.session]
      return { ...d, users: { ...d.users, [d.session]: fn(cur) } }
    })
  }, [])

  const value = useMemo(
    () => ({ user, login, register, resetPassword, logout, updateUser }),
    [user, login, register, resetPassword, logout, updateUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

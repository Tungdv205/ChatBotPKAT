import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Avatar } from '../components/Brand.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { eff } from '../utils/appointments.js'
import { phoneRe } from '../utils/helpers.js'

// Công tắc bật/tắt
function Switch({ title, desc, on, onChange }) {
  return (
    <div className="sw">
      <div>
        <b>{title}</b>
        <small>{desc}</small>
      </div>
      <button className="switch" role="switch" aria-checked={on} aria-label={title} onClick={() => onChange(!on)}></button>
    </div>
  )
}

// Màn Hồ sơ: thông tin cá nhân, cài đặt nhắc lịch, đổi mật khẩu, đăng xuất
export default function Profile() {
  const { user, updateUser, logout } = useAuth()
  const toast = useToast()

  const done = user.appts.filter((a) => eff(a) === 'done')
  const pts = Math.floor(done.reduce((s, a) => s + a.total, 0) / 10000)

  // Form thông tin cá nhân
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', dob: user.dob || '', gender: user.gender || '' })
  const [err, setErr] = useState('')
  const setField = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const saveProfile = (e) => {
    e.preventDefault()
    const phone = f.phone.replace(/[\s.]/g, '')
    if (!f.name.trim()) return setErr('Nhập họ và tên.')
    if (phone && !phoneRe.test(phone)) return setErr('Số điện thoại gồm 10 số, bắt đầu bằng 0.')
    updateUser((u) => ({ ...u, name: f.name.trim(), phone, dob: f.dob, gender: f.gender }))
    setErr('')
    toast('Đã lưu hồ sơ')
  }

  // Form đổi mật khẩu
  const [pw, setPw] = useState({ old: '', pass: '', pass2: '' })
  const [pwErr, setPwErr] = useState('')
  const setPwField = (k) => (e) => setPw((s) => ({ ...s, [k]: e.target.value }))

  const changePw = (e) => {
    e.preventDefault()
    if (pw.old !== user.pass) return setPwErr('Mật khẩu hiện tại chưa đúng.')
    if (pw.pass.length < 6) return setPwErr('Mật khẩu mới cần ít nhất 6 ký tự.')
    if (pw.pass !== pw.pass2) return setPwErr('Hai mật khẩu mới chưa giống nhau.')
    updateUser((u) => ({ ...u, pass: pw.pass }))
    setPw({ old: '', pass: '', pass2: '' })
    setPwErr('')
    toast('Đã đổi mật khẩu')
  }

  const setSetting = (k) => (v) => updateUser((u) => ({ ...u, settings: { ...u.settings, [k]: v } }))

  return (
    <>
      <div className="phead">
        <div>
          <h1>Hồ sơ</h1>
          <p>Thông tin cá nhân, mật khẩu và cài đặt.</p>
        </div>
      </div>

      <div className="card">
        <div className="prof-h">
          <Avatar name={user.name} index={0} size={64} />
          <div style={{ minWidth: 0 }}>
            <h2>{user.name}</h2>
            <p className="hint" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </p>
          </div>
        </div>
        <div className="stats" style={{ marginTop: 16 }}>
          <div className="stat">
            <b>{user.appts.length}</b>
            <small>Lịch đã đặt</small>
          </div>
          <div className="stat">
            <b>{done.length}</b>
            <small>Hoàn thành</small>
          </div>
          <div className="stat">
            <b>{pts}</b>
            <small>Điểm thưởng</small>
          </div>
        </div>
      </div>

      <div className="two">
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Thông tin cá nhân</h2>
          <form onSubmit={saveProfile} noValidate>
            <div className="field">
              <label htmlFor="p-name">Họ và tên</label>
              <input id="p-name" type="text" value={f.name} onChange={setField('name')} />
            </div>
            <div className="field">
              <label htmlFor="p-email">Email</label>
              <input id="p-email" type="email" value={user.email} disabled />
            </div>
            <div className="field">
              <label htmlFor="p-phone">Số điện thoại</label>
              <input id="p-phone" type="tel" value={f.phone} onChange={setField('phone')} />
            </div>
            <div className="field">
              <label htmlFor="p-dob">Ngày sinh</label>
              <input id="p-dob" type="date" value={f.dob} onChange={setField('dob')} />
            </div>
            <div className="field">
              <label htmlFor="p-gender">Giới tính</label>
              <select id="p-gender" value={f.gender} onChange={setField('gender')}>
                <option value="">Không muốn nêu</option>
                <option value="Nữ">Nữ</option>
                <option value="Nam">Nam</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            {err && (
              <p className="err" role="alert">
                {err}
              </p>
            )}
            <button className="btn btn-primary" type="submit">
              Lưu thay đổi
            </button>
          </form>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card">
            <h2 style={{ fontSize: 18, marginBottom: 6 }}>Cài đặt</h2>
            <Switch
              title="Nhắc lịch trước 24 giờ"
              desc="Gửi thông báo khi sắp đến giờ hẹn"
              on={!!user.settings.remind}
              onChange={setSetting('remind')}
            />
            <Switch
              title="Nhận ưu đãi"
              desc="Thông báo mã giảm giá mới"
              on={!!user.settings.promo}
              onChange={setSetting('promo')}
            />
          </div>

          <div className="card">
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>Đổi mật khẩu</h2>
            <form onSubmit={changePw} noValidate>
              <div className="field">
                <label htmlFor="w-old">Mật khẩu hiện tại</label>
                <input id="w-old" type="password" autoComplete="current-password" value={pw.old} onChange={setPwField('old')} />
              </div>
              <div className="field">
                <label htmlFor="w-new">Mật khẩu mới</label>
                <input id="w-new" type="password" autoComplete="new-password" value={pw.pass} onChange={setPwField('pass')} />
              </div>
              <div className="field">
                <label htmlFor="w-new2">Nhập lại mật khẩu mới</label>
                <input id="w-new2" type="password" autoComplete="new-password" value={pw.pass2} onChange={setPwField('pass2')} />
              </div>
              {pwErr && (
                <p className="err" role="alert">
                  {pwErr}
                </p>
              )}
              <button className="btn btn-line" type="submit">
                Đổi mật khẩu
              </button>
            </form>
          </div>

          <button className="btn btn-danger" onClick={logout}>
            <Icon name="out" size={18} />
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  )
}
import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { useAdmin } from './AdminContext.jsx'

// Đăng nhập quản trị (đường dẫn /admin)
export default function AdminLogin() {
  const { login } = useAdmin()
  const [f, setF] = useState({ email: '', pass: '' })
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    const r = login(f.email.trim().toLowerCase(), f.pass)
    if (!r.ok) setErr(r.error)
  }

  return (
    <div className="auth">
      <section className="auth-brand">
        <span className="mark">
          <Icon name="cross" size={38} />
        </span>
        <h1>Quản trị Phòng khám đa khoa Anh Thu</h1>
      </section>
      <section className="auth-form">
        <div className="auth-card">
          <h2>Đăng nhập quản trị</h2>
          <p className="sub">Dành cho nhân viên và quản lý của phòng khám.</p>
          <div className="demo-box">
            <span>
              Tài khoản dùng thử
              <br />
              <b>admin@henlich.vn</b> · <b>admin123</b>
            </span>
            <button
              type="button"
              className="btn btn-sm btn-line"
              onClick={() => setF({ email: 'admin@henlich.vn', pass: 'admin123' })}
            >
              Điền sẵn
            </button>
          </div>
          <form onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="a-email">Email</label>
              <input id="a-email" type="email" autoComplete="username" value={f.email} onChange={set('email')} />
            </div>
            <div className="field">
              <label htmlFor="a-pass">Mật khẩu</label>
              <div className="pw">
                <input
                  id="a-pass"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={f.pass}
                  onChange={set('pass')}
                />
                <button type="button" onClick={() => setShow((s) => !s)}>
                  {show ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>
            <p className="err" role="alert">{err}</p>
            <button className="btn btn-primary btn-block" type="submit">Đăng nhập</button>
          </form>
          <p className="auth-alt">
            <a className="link" href="/">Về trang đặt lịch cho khách</a>
          </p>
        </div>
      </section>
    </div>
  )
}
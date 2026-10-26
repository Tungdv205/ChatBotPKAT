import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { emailRe, phoneRe } from '../utils/helpers.js'

// Ô mật khẩu có nút Hiện/Ẩn
function PasswordField({ id, label, name, value, onChange, autoComplete, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pw">
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        <button type="button" onClick={() => setShow((s) => !s)}>
          {show ? 'Ẩn' : 'Hiện'}
        </button>
      </div>
    </div>
  )
}

function LoginForm({ go }) {
  const { login } = useAuth()
  const [f, setF] = useState({ email: '', pass: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    const email = f.email.trim().toLowerCase()
    if (!emailRe.test(email)) return setErr('Nhập email hợp lệ, ví dụ ten@email.com.')
    if (!f.pass) return setErr('Nhập mật khẩu.')
    const r = login(email, f.pass)
    if (!r.ok) setErr(r.error)
  }

  return (
    <>
      <h2>Đăng nhập</h2>
      <p className="sub">Quản lý lịch hẹn của bạn ở một nơi.</p>
      <div className="demo-box">
        <span>
          Tài khoản dùng thử
          <br />
          <b>demo@henlich.vn</b> · <b>123456</b>
        </span>
        <button
          type="button"
          className="btn btn-sm btn-line"
          onClick={() => setF({ email: 'demo@henlich.vn', pass: '123456' })}
        >
          Điền sẵn
        </button>
      </div>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="l-email">Email</label>
          <input
            id="l-email"
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="ten@email.com"
            value={f.email}
            onChange={set('email')}
          />
        </div>
        <PasswordField
          id="l-pass"
          label="Mật khẩu"
          autoComplete="current-password"
          placeholder="Nhập mật khẩu"
          value={f.pass}
          onChange={set('pass')}
        />
        <p className="err" role="alert">{err}</p>
        <button className="btn btn-primary btn-block" type="submit">Đăng nhập</button>
      </form>
      <p className="auth-alt">
        <button className="link" onClick={() => go('forgot')}>Quên mật khẩu?</button>
      </p>
      <p className="auth-alt">
        Chưa có tài khoản? <button className="link" onClick={() => go('register')}>Đăng ký</button>
      </p>
    </>
  )
}

function RegisterForm({ go }) {
  const { register } = useAuth()
  const toast = useToast()
  const [f, setF] = useState({ name: '', email: '', phone: '', pass: '', pass2: '', terms: false })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    const email = f.email.trim().toLowerCase()
    const phone = f.phone.replace(/[\s.]/g, '')
    if (!f.name.trim()) return setErr('Nhập họ và tên.')
    if (!emailRe.test(email)) return setErr('Nhập email hợp lệ, ví dụ ten@email.com.')
    if (!phoneRe.test(phone)) return setErr('Số điện thoại gồm 10 số, bắt đầu bằng 0.')
    if (f.pass.length < 6) return setErr('Mật khẩu cần ít nhất 6 ký tự.')
    if (f.pass !== f.pass2) return setErr('Hai mật khẩu chưa giống nhau.')
    if (!f.terms) return setErr('Bạn cần đồng ý với điều khoản để tiếp tục.')
    const r = register({ name: f.name.trim(), email, phone, pass: f.pass })
    if (!r.ok) return setErr(r.error)
    toast('Đăng ký thành công')
  }

  return (
    <>
      <h2>Tạo tài khoản</h2>
      <p className="sub">Mất chưa đến một phút.</p>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="r-name">Họ và tên</label>
          <input id="r-name" type="text" autoComplete="name" placeholder="Nguyễn Văn A" value={f.name} onChange={set('name')} />
        </div>
        <div className="field">
          <label htmlFor="r-email">Email</label>
          <input id="r-email" type="email" autoComplete="email" inputMode="email" placeholder="ten@email.com" value={f.email} onChange={set('email')} />
        </div>
        <div className="field">
          <label htmlFor="r-phone">Số điện thoại</label>
          <input id="r-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="09xx xxx xxx" value={f.phone} onChange={set('phone')} />
        </div>
        <PasswordField id="r-pass" label="Mật khẩu (từ 6 ký tự)" autoComplete="new-password" value={f.pass} onChange={set('pass')} />
        <div className="field">
          <label htmlFor="r-pass2">Nhập lại mật khẩu</label>
          <input id="r-pass2" type="password" autoComplete="new-password" value={f.pass2} onChange={set('pass2')} />
        </div>
        <label className="check">
          <input type="checkbox" id="r-terms" checked={f.terms} onChange={(e) => setF({ ...f, terms: e.target.checked })} />
          <span>Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật.</span>
        </label>
        <p className="err" role="alert">{err}</p>
        <button className="btn btn-primary btn-block" type="submit">Đăng ký</button>
      </form>
      <p className="auth-alt">
        Đã có tài khoản? <button className="link" onClick={() => go('login')}>Đăng nhập</button>
      </p>
    </>
  )
}

function ForgotForm({ go }) {
  const { resetPassword } = useAuth()
  const toast = useToast()
  const [f, setF] = useState({ email: '', pass: '', pass2: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    const email = f.email.trim().toLowerCase()
    if (f.pass.length < 6) return setErr('Mật khẩu mới cần ít nhất 6 ký tự.')
    if (f.pass !== f.pass2) return setErr('Hai mật khẩu chưa giống nhau.')
    const r = resetPassword(email, f.pass)
    if (!r.ok) return setErr(r.error)
    go('login')
    toast('Đã đặt mật khẩu mới, hãy đăng nhập')
  }

  return (
    <>
      <h2>Đặt lại mật khẩu</h2>
      <p className="sub">Bản dùng thử không gửi email. Nhập email của bạn và đặt mật khẩu mới ngay tại đây.</p>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="f-email">Email đã đăng ký</label>
          <input id="f-email" type="email" inputMode="email" value={f.email} onChange={set('email')} />
        </div>
        <div className="field">
          <label htmlFor="f-pass">Mật khẩu mới</label>
          <input id="f-pass" type="password" autoComplete="new-password" value={f.pass} onChange={set('pass')} />
        </div>
        <div className="field">
          <label htmlFor="f-pass2">Nhập lại mật khẩu mới</label>
          <input id="f-pass2" type="password" autoComplete="new-password" value={f.pass2} onChange={set('pass2')} />
        </div>
        <p className="err" role="alert">{err}</p>
        <button className="btn btn-primary btn-block" type="submit">Đặt mật khẩu mới</button>
      </form>
      <p className="auth-alt">
        <button className="link" onClick={() => go('login')}>Quay lại đăng nhập</button>
      </p>
    </>
  )
}

export default function Login() {
  const [view, setView] = useState('login')
  return (
    <div className="auth">
      <section className="auth-brand">
        <span className="mark">
          <Icon name="cross" size={38} />
        </span>
        <h1>Phòng khám đa khoa Anh Thu</h1>
      </section>
      <section className="auth-form">
        <div className="auth-card">
          {view === 'login' && <LoginForm go={setView} />}
          {view === 'register' && <RegisterForm go={setView} />}
          {view === 'forgot' && <ForgotForm go={setView} />}
        </div>
      </section>
    </div>
  )
}

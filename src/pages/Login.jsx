import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { emailRe, phoneRe } from '../utils/helpers.js'

// Luật mật khẩu giống backend: 8 đến 64 ký tự, có cả chữ và số
const passRe = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/
const PASS_MSG = 'Mật khẩu cần 8 đến 64 ký tự, gồm cả chữ và số.'

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
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const email = f.email.trim().toLowerCase()
    if (!emailRe.test(email)) return setErr('Nhập email hợp lệ, ví dụ ten@email.com.')
    if (!f.pass) return setErr('Nhập mật khẩu.')
    setBusy(true)
    const r = await login(email, f.pass)
    setBusy(false)
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
          <b>demo@henlich.vn</b> · <b>demo1234</b>
        </span>
        <button
          type="button"
          className="btn btn-sm btn-line"
          onClick={() => setF({ email: 'demo@henlich.vn', pass: 'demo1234' })}
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
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
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
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const email = f.email.trim().toLowerCase()
    const phone = f.phone.replace(/[\s.]/g, '')
    if (!f.name.trim()) return setErr('Nhập họ và tên.')
    if (!emailRe.test(email)) return setErr('Nhập email hợp lệ, ví dụ ten@email.com.')
    if (!phoneRe.test(phone)) return setErr('Số điện thoại gồm 10 số, bắt đầu bằng 0.')
    if (!passRe.test(f.pass)) return setErr(PASS_MSG)
    if (f.pass !== f.pass2) return setErr('Hai mật khẩu chưa giống nhau.')
    if (!f.terms) return setErr('Bạn cần đồng ý với điều khoản để tiếp tục.')
    setBusy(true)
    const r = await register({ name: f.name.trim(), email, phone, pass: f.pass })
    setBusy(false)
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
        <PasswordField id="r-pass" label="Mật khẩu (từ 8 ký tự, có chữ và số)" autoComplete="new-password" value={f.pass} onChange={set('pass')} />
        <div className="field">
          <label htmlFor="r-pass2">Nhập lại mật khẩu</label>
          <input id="r-pass2" type="password" autoComplete="new-password" value={f.pass2} onChange={set('pass2')} />
        </div>
        <label className="check">
          <input type="checkbox" id="r-terms" checked={f.terms} onChange={(e) => setF({ ...f, terms: e.target.checked })} />
          <span>Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật.</span>
        </label>
        <p className="err" role="alert">{err}</p>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>
      <p className="auth-alt">
        Đã có tài khoản? <button className="link" onClick={() => go('login')}>Đăng nhập</button>
      </p>
    </>
  )
}

function ForgotForm({ go }) {
  const { requestReset } = useAuth()
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const em = email.trim().toLowerCase()
    if (!emailRe.test(em)) return setErr('Nhập email hợp lệ, ví dụ ten@email.com.')
    setBusy(true)
    const r = await requestReset(em)
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    setErr('')
    setSent(true)
  }

  return (
    <>
      <h2>Quên mật khẩu</h2>
      {sent ? (
        <>
          <p className="sub">
            Nếu email này có tài khoản, hướng dẫn đặt lại mật khẩu đã được gửi. Liên kết có hiệu lực trong 30 phút.
          </p>
          <p className="hint">Bản dùng thử chưa gửi email thật: liên kết nằm trong cửa sổ đang chạy backend, dòng có chữ [THU NGHIEM].</p>
        </>
      ) : (
        <>
          <p className="sub">Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để bạn đặt mật khẩu mới.</p>
          <form onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="f-email">Email đã đăng ký</label>
              <input id="f-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <p className="err" role="alert">{err}</p>
            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
              {busy ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
            </button>
          </form>
        </>
      )}
      <p className="auth-alt">
        <button className="link" onClick={() => go('login')}>Quay lại đăng nhập</button>
      </p>
    </>
  )
}

// Màn đặt mật khẩu mới: mở từ liên kết trong email, dạng /?reset=MÃ
function ResetForm({ go, code }) {
  const { resetPassword } = useAuth()
  const toast = useToast()
  const [f, setF] = useState({ pass: '', pass2: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (!passRe.test(f.pass)) return setErr(PASS_MSG)
    if (f.pass !== f.pass2) return setErr('Hai mật khẩu chưa giống nhau.')
    setBusy(true)
    const r = await resetPassword(code, f.pass)
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    window.history.replaceState({}, '', window.location.pathname)
    go('login')
    toast('Đã đặt mật khẩu mới, hãy đăng nhập')
  }

  return (
    <>
      <h2>Đặt mật khẩu mới</h2>
      <p className="sub">Mật khẩu cần 8 đến 64 ký tự, gồm cả chữ và số.</p>
      <form onSubmit={submit} noValidate>
        <PasswordField id="n-pass" label="Mật khẩu mới" autoComplete="new-password" value={f.pass} onChange={set('pass')} />
        <div className="field">
          <label htmlFor="n-pass2">Nhập lại mật khẩu mới</label>
          <input id="n-pass2" type="password" autoComplete="new-password" value={f.pass2} onChange={set('pass2')} />
        </div>
        <p className="err" role="alert">{err}</p>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Đang lưu...' : 'Đặt mật khẩu mới'}
        </button>
      </form>
      <p className="auth-alt">
        <button className="link" onClick={() => go('login')}>Quay lại đăng nhập</button>
      </p>
    </>
  )
}

export default function Login() {
  const resetCode = new URLSearchParams(window.location.search).get('reset')
  const [view, setView] = useState(resetCode ? 'reset' : 'login')
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
          {view === 'reset' && <ResetForm go={setView} code={resetCode} />}
        </div>
      </section>
    </div>
  )
}
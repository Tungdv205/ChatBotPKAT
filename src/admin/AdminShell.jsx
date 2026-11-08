import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Logo, Avatar } from '../components/Brand.jsx'
import { useAdmin } from './AdminContext.jsx'
import { eff } from '../utils/appointments.js'

// Menu quản trị: [mã màn hình, nhãn, biểu tượng]
export const ADMIN_NAV = [
  ['dash', 'Tổng quan', 'grid'],
  ['appts', 'Lịch hẹn', 'cal'],
  ['services', 'Dịch vụ', 'pulse'],
  ['promos', 'Ưu đãi', 'tag'],
  ['customers', 'Khách hàng', 'users'],
  ['tickets', 'Yêu cầu hỗ trợ', 'help'],
  ['staff', 'Bác sĩ, nhân viên', 'user'],
]

const TICKET_DONE = 'Đã xử lý'

// Chuông thông báo: đếm việc cần xử lý, bấm vào để chuyển tới màn tương ứng
function Bell({ onNav }) {
  const { appts, tickets } = useAdmin()
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  const upcoming = appts.filter((a) => eff(a) === 'upcoming').length
  const pending = tickets.filter((t) => t.status !== TICKET_DONE).length
  const total = upcoming + pending

  // Bấm ra ngoài hoặc nhấn Esc thì đóng
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (view) => {
    setOpen(false)
    onNav(view)
  }

  const rows = [
    ['appts', 'Lịch hẹn sắp tới', upcoming],
    ['tickets', 'Yêu cầu hỗ trợ chờ xử lý', pending],
  ]

  return (
    <div ref={box} style={{ position: 'relative' }}>
      <button
        className="iconbtn"
        onClick={() => setOpen((v) => !v)}
        aria-label={total ? 'Thông báo, ' + total + ' việc cần xử lý' : 'Thông báo'}
        aria-expanded={open}
        title="Thông báo"
      >
        <Icon name="bell" />
        {total > 0 && <span className="badge">{total > 99 ? '99+' : total}</span>}
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 50,
            width: 280,
            maxWidth: 'calc(100vw - 32px)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            border: '1px solid var(--line)',
            borderRadius: 14,
            boxShadow: '0 12px 32px rgba(0,0,0,.18)',
            padding: 8,
            zIndex: 50,
          }}
        >
          <div style={{ padding: '8px 10px', fontWeight: 600 }}>Việc cần xử lý</div>
          {total === 0 ? (
            <div style={{ padding: '8px 10px 12px', color: 'var(--muted)' }}>Hiện không có việc nào cần xử lý.</div>
          ) : (
            rows.map(([view, label, n]) => (
              <button
                key={view}
                role="menuitem"
                onClick={() => go(view)}
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px',
                  borderRadius: 10,
                  background: 'transparent',
                  color: 'inherit',
                  textAlign: 'left',
                  opacity: n ? 1 : 0.55,
                }}
              >
                <span>{label}</span>
                <b>{n}</b>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Khung quản trị: thanh trên (Quay lại, tìm kiếm, thông báo, đăng xuất), menu bên trái (máy tính),
// dải menu cuộn ngang (điện thoại)
export default function AdminShell({ view, onNav, canBack, onBack, onSearch, children }) {
  const { admin, logout } = useAdmin()

  return (
    <div className="shell">
      <header className="topbar">
        <div className="top-l">
          {canBack && (
            <button className="iconbtn" onClick={onBack} aria-label="Quay lại" title="Quay lại">
              <Icon name="chevl" />
            </button>
          )}
          <Logo />
          <span className="pill pill-sun">Quản trị</span>
        </div>
        <div className="top-r">
          <button className="iconbtn" onClick={onSearch} aria-label="Tìm kiếm" title="Tìm kiếm">
            <Icon name="search" />
          </button>
          <Bell onNav={onNav} />
          <button className="iconbtn" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất">
            <Icon name="out" />
          </button>
        </div>
      </header>

      <aside className="side">
        <nav className="snav" aria-label="Menu quản trị">
          {ADMIN_NAV.map(([id, label, ic]) => (
            <button
              key={id}
              className="si"
              aria-current={view === id ? 'page' : undefined}
              onClick={() => onNav(id)}
            >
              <Icon name={ic} />
              {label}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="me">
            <Avatar name={admin.name} index={1} size={40} />
            <div>
              <b>{admin.name}</b>
              <small>{admin.email}</small>
            </div>
          </div>
          <a className="btn btn-line btn-sm" href="/">
            Xem trang khách
          </a>
          <button className="btn btn-line btn-sm" onClick={logout}>
            <Icon name="out" size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="col">
        <main className="main">
          <div className="main-in">
            <div className="admin-tabs" role="tablist">
              {ADMIN_NAV.map(([id, label]) => (
                <button key={id} className="chip" aria-pressed={view === id} onClick={() => onNav(id)}>
                  {label}
                </button>
              ))}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}